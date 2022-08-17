/*******************************************************************************************************
 * File: openInJosm.js
 * Project: hootenanny-ui
 * @author Milla Zagorski
 * @date 8-10-2022
 *******************************************************************************************************/

import FormFactory       from '../../tools/formFactory';
import { openInJosmForm } from '../../config/domMetadata';

import _flattenDeep   from 'lodash-es/flattenDeep';
import _isEmpty       from 'lodash-es/isEmpty';
import { formatSize } from '../../tools/utilities';

export default class OpenInJosm {
    constructor( translations, d, type ) {
        const isDatasets = type === 'Datasets';
        this.translations = translations;
        this.input = isDatasets ? d.map(n => n.name).join(',') : d.data.name;
        this.id = isDatasets ? d.map(n => n.id).join(',') : d.data.id;
        this.type = type;
        this.form = openInJosmForm.call(this, isDatasets );
        this.data = d;
        this.maxExportSize = 2000000000; // 2GB
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
        this.container = this.formFactory.generateForm( 'body', 'export-data-form', metadata );
        this.translationSchemaCombo = this.container.select( '#exportTranslationCombo' );
        this.exportFormatCombo = this.container.select( '#exportFormatCombo' );
        this.includeHootTagsCheckbox = this.container.select( '#exportHootTags' );
        this.submitButton = this.container.select( '#openDatasetBtn' );
        this.submitButton.attr('disabled', null);

        if ( this.type === 'Datasets' ) {
            this.dataExportNameTextInput.attr( 'placeholder', this.input.split(',').join('_') );
        } else if ( this.type === 'Folder' ) {
            const folderSize = this.calculateFolderSize( this.data );

            if ( folderSize > this.maxExportSize ) {
                this.container.select( 'form' )
                .append( 'div' )
                .classed( 'keyline-all round center alert-warn', true )
                .text(
                    `WARNING: Exporting ${ formatSize(folderSize) } will take a long time.`
                );
            }
        }
        let container = this.container;
        Hoot.events.once( 'modal-closed', () => {
            container.remove();
        });

        return this;
    }

    /**
     * Recurses through the folder down and calculates the size, in bytes, of all the datasets under the root file
     * @param root
     * @returns total folder size in bytes
     */
    calculateFolderSize ( root ) {
        let stack = [ root ];
        let totalSize = 0;

        while ( stack.length > 0 ) {
            const folder = stack.pop();
            // children are stored in different locations in the object based on whether the folder is open or not
            // return an empty array if null or undefined
            const children = folder.children || folder._children || (folder.data ? folder.data._children : []) || [];

            // skip if no children
            if (children.length === 0) continue;

            totalSize += children.filter( child => child.size ).reduce( ( acc, dataset ) => {
                return acc + dataset.size;
            }, 0 );

            const folders = children.filter( child => child.type === 'folder' );
            stack = stack.concat(folders);
        }

        return totalSize;
    }

    validate ( name ) {
        this.formValid = this.validateFields( this.translationSchemaCombo.node(), name ) &&
            this.validateFields( this.exportFormatCombo.node(), name );

        this.updateButtonState();
    }

    validateFields( d, name ) {
        let id              = d.id,
            target          = d3.select( `#${id}` ),
            invalid         = !target.property( 'value' ).length;

        if ( id === name ) {
            target.classed( 'invalid', invalid );
        }

        return !invalid;
    }

    validateTextInput ( d, name ) {
        let id               = d.id,
            target           = d3.select( `#${id}` ),
            node             = target.node(),
            str              = node.value,

            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( !str.length || unallowedPattern.test( str )) {
            valid = false;
        }
        if ( id === name ) {
            target.classed( 'invalid', !valid );
        }

        return valid;
    }

    updateButtonState() {
        this.submitButton.node().disabled = !this.formValid;
    }

    getTranslationPath() {
        const selectedTranslation = this.translationSchemaCombo.node().value;
        const translation = this.translations.find( t => t.name === selectedTranslation );
        return !translation.hasOwnProperty('path')  ? translation.exportPath : translation.path;
    }

    getOutputType() {
        return {
            'OpenStreetMap (OSM)': 'osm',
            'OpenStreetMap (PBF)': 'osm.pbf'
        }[this.exportFormatCombo.node().value];
    }

    loadingState() {
        this.submitButton
            .select( 'span' )
            .text( 'Cancel Export' );

        // overwrite the submit click action with a cancel action
        this.submitButton.on( 'click', () => {
            Hoot.api.cancelJob(this.jobId);
        } );

        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.container.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );
    }

    getInputType() {
        let type;
        switch ( this.type ) {
            case 'Dataset': {
                type = 'db';
                break;
            }
            case 'Datasets': {
                type = 'dbs';
                break;
            }
            case 'Folder' : {
                type = 'folder';
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
                let input = this.dataExportNameTextInput.property( 'value' );
                output = _isEmpty( input ) ? this.dataExportNameTextInput.attr( 'placeholder' ) : input;
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
        let self = this,
            data = {
                input: self.id,
                inputtype: self.getInputType(),
                includehoottags: self.includeHootTagsCheckbox.property( 'checked' ),
                outputname: self.getOutputName(),
                outputtype: self.getOutputType(),
                translation: self.getTranslationPath()
            };

        console.log('\tDATA**: ', data);

        this.loadingState();

        this.processRequest = Hoot.api.openInJosm(data)
            .then(resp => {
                this.jobId = resp.data.jobid;

                return Hoot.api.statusInterval(this.jobId);
            })
            .then(async resp => {
                if (resp.data && resp.data.status !== 'cancelled') {
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
                if (resp.data && resp.data.status === 'cancelled') {
                    message = 'Open data in JOSM cancelled';
                } else {
                    const dataType = data.inputType === 'Folder' ? 'folder' : 'Dataset';
                    message = `'${data.outputname}' ${dataType} saved to your "Downloads" folder.`;
                }

                Hoot.message.alert({
                    data: resp.data,
                    message: message,
                    status: 200,
                    type: resp.type
                });

                return resp;
            })
            .catch((err) => {
                console.error(err);

                let message = 'Error opening data in JOSM',
                    type = err.type,
                    keepOpen = true;

                if (err.data.commandDetail && err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                    message = err.data.commandDetail[0].stderr;
                }

                Hoot.message.alert({ message, type, keepOpen });
            })
            .finally(() => {
                Hoot.events.emit('modal-closed');

                // THIS WILL ALERT JOSM THERE IS A FILE TO LOAD
                const alertHootRevLayer = {
                    layer_name: data.outputname
                };
                const hootRevParams = Object.keys(alertHootRevLayer)
                    .map((key) => `${key}=${encodeURIComponent(alertHootRevLayer[key])}`)
                    .join('&');
                const finalHootRevUri = `?${hootRevParams}?`;
                let alertUrl = new URL(finalHootRevUri, `http://127.0.0.1:8111/alertHootReview`);
                callJosmRemoteControl(alertUrl);
            });
    }
}

//---------------------------------------------------------------------
let safariWindowReference = null;
const callJosmRemoteControl = function (uri) {
    // Safari won't send AJAX commands to the default (insecure) JOSM port when
    // on a secure site, and the secure JOSM port uses a self-signed certificate
    // that requires the user to jump through a bunch of hoops to trust before
    // communication can proceed. So for Safari only, fall back to sending JOSM
    // requests via the opening of a separate window instead of AJAX.
    // Source: https://github.com/osmlab/maproulette3
    if (window.safari) {
        return new Promise((resolve, reject) => {
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
        .then((response) => response.status === 200)
        .catch((error) => {
            console.log(error);

            // var fs = require('fs');
            // var filePath = 'pathtofile'; 
            // fs.unlinkSync(filePath);

            let message = 'Make sure that JOSM is already open.',
                type = 'error',
                keepOpen = true;

            Hoot.message.alert({ message, type, keepOpen });

            return false;
        });
};