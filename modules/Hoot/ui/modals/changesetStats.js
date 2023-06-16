import FormFactory from '../../tools/formFactory';
import { uiChangesetEditor } from '../../../ui/changeset_editor';
import { svgIcon } from '../../../svg';

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
                    Hoot.context.storage('comment', changed.comment);
                    Hoot.context.storage('commentDate', Date.now());
                } else {
                    that.updateSubmitButton();
                }
            }
            if (changed.hasOwnProperty('source')) {
                if (changed.source === undefined) {
                    Hoot.context.storage('source', null);
                } else if (!onInput) {
                    Hoot.context.storage('source', changed.source);
                    Hoot.context.storage('commentDate', Date.now());
                }
            }
            if (changed.hasOwnProperty('hashtags')) {
                if (changed.hashtags === undefined) {
                    Hoot.context.storage('hashtags', null);
                } else if (!onInput) {
                    // format hashtags so there is # in front of each one
                    changed.hashtags = changed.hashtags.split(/[,;\s]+/)
                        .map(function (s) {
                            if (s[0] !== '#') { s = '#' + s; } // prepend '#'
                            return s;
                        })
                        .join(';');

                    Hoot.context.storage('hashtags', changed.hashtags);
                    Hoot.context.storage('commentDate', Date.now());
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
            this.submitButton = d3.select( `#${ metadata.button.id }` );
            this.createComment();
            this.updateSubmitButton();
        } else if (this.changesetInfo.error) {
            this.createError();
        }
        this.createTable();

    }

    updateSubmitButton() {
        this.submitButton.attr( 'disabled', function() {
                var n = d3.select('#preset-input-comment').node();
                return (n && n.value.length) ? null : true;
            });
    }

    createError() {
        this.form
            .select( '.wrapper div' )
            .insert( 'div')
            .attr('class', 'changeset-error')
            .call(svgIcon('#iD-icon-alert', 'inline'))
            .append('span')
            .text(this.changesetInfo.error)
            ;
    }

    createTable() {
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
        const commentDate = +Hoot.context.storage('commentDate') || 0;
        const currDate = Date.now();
        const cutoff = 2 * 86400 * 1000;   // 2 days
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            Hoot.context.storage('comment', null);
            Hoot.context.storage('hashtags', null);
            Hoot.context.storage('source', null);
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
            Hoot.context.storage('source', secondaryName);
        }

        if (!Hoot.context.storage('hashtags')) {
            Hoot.context.storage('hashtags', '#hootenanny');
        }

        this.tags = {
            comment: Hoot.context.storage('comment') || '',
            hashtags: Hoot.context.storage('hashtags') || '',
            source: Hoot.context.storage('source') || ''
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
        params.comment = Hoot.context.storage('comment') || '';
        params.hashtags = Hoot.context.storage('hashtags') || '';
        params.source = Hoot.context.storage('source') || '';

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
