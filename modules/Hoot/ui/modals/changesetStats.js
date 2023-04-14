import FormFactory from '../../tools/formFactory';
import { uiChangesetEditor } from '../../../ui/changeset_editor';
import { prefs } from '../../../core';
import { select as d3_select } from 'd3-selection';

export default class ChangesetStats {
    constructor( job, data, viewOnly ) {
        this.job = job;
        this.changesetInfo = data;
        this.viewOnly = viewOnly;
        this.changesetEditor = uiChangesetEditor(Hoot.context)
            .on('change', changeTags);
        const that = this;
        function changeTags(changed, onInput) {
            if (changed.hasOwnProperty('comment')) {
                if (changed.comment === undefined) {
                    changed.comment = '';
                }
                if (!onInput) {
                    prefs('comment', changed.comment);
                    prefs('commentDate', Date.now());
                } else {
                    that.updateSubmitButton();
                }
            }
            if (changed.hasOwnProperty('source')) {
                if (changed.source === undefined) {
                    prefs('source', null);
                } else if (!onInput) {
                    prefs('source', changed.source);
                    prefs('commentDate', Date.now());
                }
            }
            if (changed.hasOwnProperty('hashtags')) {
                if (changed.hashtags === undefined) {
                    prefs('hashtags', null);
                } else if (!onInput) {
                    // format hashtags so there is # in front of each one
                    changed.hashtags = changed.hashtags.split(/[,;\s]+/)
                        .map(function (s) {
                            if (s[0] !== '#') { s = '#' + s; } // prepend '#'
                            return s;
                        })
                        .join(';');

                    prefs('hashtags', changed.hashtags);
                    prefs('commentDate', Date.now());
                }
            }

            that.tags = Object.assign(that.tags, changed);

            that.changesetSection
                .call(that.changesetEditor
                    .tags(that.tags)
                );
        }
    }

    render() {
        let titleText = (this.viewOnly) ? 'Changeset Metadata' : 'Upload Changeset';

        let metadata = {
            title: titleText
        };

        if (!this.viewOnly) {
            metadata.button = {
                text: 'Upload Changeset',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            };
        }

        let formId = 'changesetPushTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        if (!this.viewOnly) {
            this.submitButton = d3_select( `#${ metadata.button.id }` );
            this.createComment();
            this.updateSubmitButton();
        }
        this.createTable();

    }

    updateSubmitButton() {
        this.submitButton.attr( 'disabled', function() {
                var n = d3_select('#preset-input-comment').node();
                return (n && n.value.length) ? null : true;
            });
    }

    createTable() {
        const { hasTags } = this.changesetInfo;

        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.changeset-editor' )
            .classed( 'changesetInfo', true );

        this.infoGrid(table);
    }

    infoGrid (tableElement) {
        const changesetStats = this.parseStats();
        let thead = tableElement.append('thead');
        let tbody = tableElement.append('tbody');

        const columns = ['', 'node', 'way', 'relation'];
        thead.append('tr')
            .selectAll('th')
            .data(columns)
            .enter()
            .append('th')
            .text(function (d) { return d; });

        let rows = tbody.selectAll('tr')
            .data(changesetStats)
            .enter()
            .append('tr');

        rows.selectAll('td')
            .data(function(row) {
                return row;
            })
            .enter()
            .append('td')
            .classed( 'strong', data => data > 0 )
            .text( data => data );
    }

    //Add changeset comment, hashtags, source
    createComment() {

        // expire stored comment, hashtags, source after cutoff datetime - #3947 #4899
        const commentDate = +prefs('commentDate') || 0;
        const currDate = Date.now();
        const cutoff = 2 * 86400 * 1000;   // 2 days
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            prefs('comment', null);
            prefs('hashtags', null);
            prefs('source', null);
        }

        // Changeset Section
        this.changesetSection = this.form
            .select( '.wrapper div' )
            .selectAll('.changeset-editor')
            .data([0]);

        this.changesetSection = this.changesetSection.enter()
            .insert('div', '.modal-footer')
            .attr('class', 'modal-section changeset-editor')
            .merge(this.changesetSection);

        let secondaryName;
        if (this.job.tags && this.job.tags.input2) {
            secondaryName = Hoot.layers.findBy('id', Number(this.job.tags.input2)).name;
            prefs('source', secondaryName);
        }

        if (!prefs('hashtags')) {
            prefs('hashtags', '#hootenanny');
        }

        this.tags = {
            comment: prefs('comment') || '',
            hashtags: prefs('hashtags') || '',
            source: prefs('source') || ''
        };

        this.changesetSection
            .call(this.changesetEditor
                .tags(this.tags)
            );

    }

    // Mainly to control order of the text displayed to the user
    parseStats() {
        let changesetStats = {
            'create' : { 'node' : 0, 'way' : 0, 'relation' : 0 },
            'modify' : { 'node' : 0, 'way' : 0, 'relation' : 0 },
            'delete' : { 'node' : 0, 'way' : 0, 'relation' : 0 }
        };

        // populate object
        Object.keys(this.changesetInfo).forEach( data => {
            let [changeType, element] = data.split('-');
            if (changeType in changesetStats) {
                changesetStats[changeType][element] = this.changesetInfo[data];
            }
        });

        // convert object to list of arrays
        const dataList = Object.keys(changesetStats).map( data => {
            return [data].concat(Object.values(changesetStats[data]));
        });

        return dataList;
    }

    handleSubmit() {

        const params  = {},
              tagsCheck = this.form.select('.applyTags');

        params.parentId   = this.job.jobId;

        //Changeset tags
        params.comment = prefs('comment') || '';
        params.hashtags = prefs('hashtags') || '';
        params.source = prefs('source') || '';

        if ( this.job.tags && this.job.tags.taskInfo ) {
            params.taskInfo = this.job.tags.taskInfo;
        }

        Hoot.api.changesetPush( params )
            .then( () => Hoot.layers.refreshLayers() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .then( resp => Hoot.message.alert( resp ) )
            .catch( err => {
                Hoot.message.alert( err );
                return false;
            } );

        this.form.remove();
    }
}
