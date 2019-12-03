import FormFactory from '../../tools/formFactory';
import { uiChangesetEditor } from '../../../ui/changeset_editor';

export default class ChangesetStats {
    constructor( job, data ) {
        this.job = job;
        this.changesetInfo = data;
        this.includeTags = false;
        this.changesetEditor = uiChangesetEditor(Hoot.context)
            .on('change', changeTags);

        function changeTags(changed, onInput) {
            if (changed.hasOwnProperty('comment')) {
                if (changed.comment === undefined) {
                    changed.comment = '';
                }
                if (!onInput) {
                    Hoot.context.storage('comment', changed.comment);
                    Hoot.context.storage('commentDate', Date.now());
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
        }
    }

    render() {
        let titleText = 'Upload Changeset';

        let metadata = {
            title: titleText,
            button: {
                text: 'Upload Changeset',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'changesetPushTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3.select( `#${ metadata.button.id }` );

        this.submitButton.property( 'disabled', false );

        this.createTable();

        this.createComment();
    }

    createTable() {
        const { hasTags } = this.changesetInfo;

        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .classed( 'changesetInfo', true );

        this.infoGrid(table);

        if (hasTags) {
            let tagsOption = this.form
                .select( '.wrapper div' )
                .insert( 'div', '.modal-footer' )
                .classed( 'tagInput', true );

            tagsOption.append( 'label' )
                .text('Apply Tag Differential?');

            const checkbox = tagsOption.append( 'input' )
                .attr( 'type', 'checkbox' )
                .property( 'checked', this.includeTags )
                .attr( 'class', 'applyTags' )
                .on('click', async ()  => {
                    this.includeTags = checkbox.property( 'checked' );
                    const stats = await Hoot.api.changesetStats(this.job.id, this.includeTags);
                    this.changesetInfo = stats.data;

                    this.form.select('table').remove();
                    tagsOption.remove();
                    this.createTable();
                });
        }
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
        var commentDate = +Hoot.context.storage('commentDate') || 0;
        var currDate = Date.now();
        var cutoff = 2 * 86400 * 1000;   // 2 days
        if (commentDate > currDate || currDate - commentDate > cutoff) {
            Hoot.context.storage('comment', null);
            Hoot.context.storage('hashtags', null);
            Hoot.context.storage('source', null);
        }

        // Changeset Section
        var changesetSection = this.form
            .select( '.wrapper div' )
            .selectAll('.changeset-editor')
            .data([0]);

        changesetSection = changesetSection.enter()
            .insert('div', '.modal-footer')
            .attr('class', 'modal-section changeset-editor')
            .merge(changesetSection);

        let secondaryName;
        if (this.job.tags && this.job.tags.input2) {
            secondaryName = Hoot.layers.findBy('id', Number(this.job.tags.input2)).name;
        }

        changesetSection
            .call(this.changesetEditor
                .tags({
                    comment: Hoot.context.storage('comment') || '',
                    hashtags: '#conflation;#hootenanny',
                    source: secondaryName
                })
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

        params.parentId   = this.job.id;

        //Changeset tags
        params.comment = Hoot.context.storage('comment') || '';


        params.APPLY_TAGS = !tagsCheck.empty() ? tagsCheck.property('checked') : false;

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
