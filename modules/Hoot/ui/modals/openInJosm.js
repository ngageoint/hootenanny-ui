/*******************************************************************************************************
 * File: openInJosm.js
 * Description: allows OSM or OSM.PBF files to be opened in JOSM from the hootenanny-ui.
 * Project: hootenanny-ui
 * @author Milla Zagorski
 * @date 8-10-2022
 *******************************************************************************************************/

import FormFactory from '../../tools/formFactory';

export default class OpenInJosm {
    constructor(translations, d, type, source) {

        const isDatasets = type === 'Datasets';
        this.translations = translations;
        this.input = isDatasets ? d.map(n => n.name).join(',') : d.data.name;
        this.id = isDatasets ? d.map(n => n.id).join(',') : d.data.id;
        this.type = type;
        this.source = source;
        this.data = d;
        this.maxExportSize = 2000000000; // 2GB

        this.isCancelled = false;
    }

    render() {
        let metadata = {
            title: `Open Selected ${this.type} in JOSM`,
            form: this.form,
            button: {
                text: 'Open',
                location: 'right',
                id: 'openDatasetBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.formFactory = new FormFactory();
        this.container = this.formFactory.generateForm('body', 'open-data-form', metadata);
        this.translationSchemaCombo = this.container.select('#openTranslationCombo');
        this.exportFormatCombo = this.container.select('#openFormatCombo');
        this.includeHootTagsCheckbox = this.container.select('#openHootTags');
        this.submitButton = this.container.select('#openDatasetBtn');
        this.submitButton.attr('disabled', null);

        let container = this.container;
        Hoot.events.once('modal-closed', () => {
            container.remove();
        });

        return this;
    }

    validate(name) {
        this.formValid = this.validateFields(this.translationSchemaCombo.node(), name) &&
            this.validateFields(this.exportFormatCombo.node(), name);

        this.updateButtonState();
    }

    validateFields(d, name) {
        let id = d.id,
            target = d3.select(`#${id}`),
            invalid = !target.property('value').length;

        if (id === name) {
            target.classed('invalid', invalid);
        }

        return !invalid;
    }

    validateTextInput(d, name) {
        let id = d.id,
            target = d3.select(`#${id}`),
            node = target.node(),
            str = node.value,

            unallowedPattern = new RegExp(/[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g),
            valid = true;

        if (!str.length || unallowedPattern.test(str)) {
            valid = false;
        }
        if (id === name) {
            target.classed('invalid', !valid);
        }

        return valid;
    }

    updateButtonState() {
        this.submitButton.node().disabled = !this.formValid;
    }

    getTranslationPath() {
        let selectedTranslation = 'OSM';
        const translation = this.translations.find(t => t.name === selectedTranslation);
        return !translation.hasOwnProperty('path') ? translation.exportPath : translation.path;
    }

    getInputType() {
        let type;
        switch (this.type) {
            case 'Dataset': {
                type = 'db';
                break;
            }
            case 'Datasets': {
                type = 'dbs';
                break;
            }
            default: break;
        }
        return type;
    }

    getOutputName() {
        let output;
        switch (this.type) {
            case 'Datasets': {
                output = 'hoot_export_datasets';
                break;
            }
            default: {
                output = this.input;
                break;
            }
        }
        return output;
    }

    handleSubmit() {

        // Check that JOSM is available for loading the data
        let checkJosmUrl = new URL('http://127.0.0.1:8111/version?jsonp=test');
        callJosmRemoteControl(checkJosmUrl, 'JOSM is up and running!', 'Make sure that JOSM is already open.').then(value => {

            // Proceed if JOSM is already open
            if (value) {
                let self = this,
                    initialName = self.getOutputName(),
                    finalName = initialName.replace(/\s/g, '');

                let data = {
                    input: self.id,
                    inputtype: self.getInputType(),
                    includehoottags: true,
                    outputname: finalName,
                    outputtype: 'OSM',
                    translation: self.getTranslationPath()
                };

                this.processRequest = Hoot.api.openInJosm(data)
                    .then(resp => {
                        this.jobId = resp.data.jobid;

                        return Hoot.api.statusInterval(this.jobId);
                    })
                    .then(async resp => {

                        if (resp.data && !this.isCancelled) {
                            await Hoot.api.saveDataset(this.jobId, data.outputname);
                        }
                        return resp;
                    })
                    .then(resp => {
                        Hoot.events.emit('modal-closed');
                        return resp;
                    })
                    .then(resp => {
                        let message;
                        if (resp.data && this.isCancelled) {
                            message = 'Open data in JOSM cancelled.';
                            Hoot.message.alert({
                                message: message,
                                type: 'warn'
                            });
                        }
                        return resp;
                    })
                    .catch((err) => {
                        let message = 'Error opening data in JOSM.',
                            type = err.type,
                            keepOpen = true;

                        if (err.data.commandDetail && err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                            message = err.data.commandDetail[0].stderr;
                        }

                        Hoot.message.alert({ message, type, keepOpen });
                    })
                    .finally(() => {
                        Hoot.events.emit('modal-closed');

                        // Alert JOSM that there is a file to load
                        if (!this.isCancelled) {

                            const alertHootRevLayer = {
                                layer_name: data.outputname
                            };

                            const hootRevParams = Object.keys(alertHootRevLayer)
                                .map((key) => `${key}=${encodeURIComponent(alertHootRevLayer[key])}`)
                                .join('&');
                            const finalHootRevUri = `?${hootRevParams}?`;
                            let alertUrl = new URL(finalHootRevUri, 'http://127.0.0.1:8111/alertHootReview');

                            callJosmRemoteControl(alertUrl, 'Dataset(s) loaded in JOSM.', 'Error loading data into JOSM.');
                        }
                    });
            } else {
                let message = 'Dataset(s) could not be loaded into JOSM.';
                Hoot.message.alert({
                    message: message,
                    type: 'error'
                });
            }
        });
    }
}

/**
 * Call JOSM remote control to alert JOSM that there is a file to load.
 * @param uri {String} The URI used to alert JOSM via remote control.
 */
let safariWindowReference = null;
const callJosmRemoteControl = function (uri, goodMessage, badMessage) {
    // Safari won't send AJAX commands to the default (insecure) JOSM port when
    // on a secure site, and the secure JOSM port uses a self-signed certificate
    // that requires the user to jump through a bunch of hoops to trust before
    // communication can proceed. So for Safari only, fall back to sending JOSM
    // requests via the opening of a separate window instead of AJAX.
    // Source: https://github.com/osmlab/maproulette3
    if (window.safari) {
        return new Promise((resolve) => {
            if (safariWindowReference && !safariWindowReference.closed) {
                safariWindowReference.close();
            }

            safariWindowReference = window.open(uri);

            // Close the window after 1 second and resolve the promise
            setTimeout(() => {
                if (safariWindowReference && !safariWindowReference.closed) {
                    safariWindowReference.close();
                }
                resolve(true);
            }, 1000);
        });
    }
    return fetch(uri)
        .then(response => {
            let message = goodMessage;
            Hoot.message.alert({
                message: message,
                type: 'success'
            });
            return response.status === 200;
        })
        .catch(() => {
            let message = badMessage;
            Hoot.message.alert({
                message: message,
                type: 'error'
            });
            return false;
        });
};