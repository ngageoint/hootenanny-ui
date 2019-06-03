import FormFactory from '../../tools/formFactory';

export default class DifferentialStats {
    constructor( jobId, data ) {
        this.jobId    = jobId;
        this.diffInfo = data;
        this.includeTags = false;
    }

    render() {
        let titleText = 'Differential Info';

        let metadata = {
            title: titleText,
            button: {
                text: 'Push Differential',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'differentialPushTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3.select( `#${ metadata.button.id }` );

        this.submitButton.property( 'disabled', false );

        this.createTable();
    }

    createTable() {
        const { hasTags } = this.diffInfo;

        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .classed( 'diffInfo', true );

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
                    const stats = await Hoot.api.differentialStats(this.jobId, this.includeTags);
                    this.diffInfo = stats.data;

                    this.form.select('table').remove();
                    tagsOption.remove();
                    this.createTable();
                });
        }
    }

    infoGrid (tableElement) {
        const diffStats = this.parseStats();
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
            .data(diffStats)
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

    // Mainly to control order of the text displayed to the user
    parseStats() {
        let diffStats = {
            'create' : { 'node' : 0, 'way' : 0, 'relation' : 0 },
            'modify' : { 'node' : 0, 'way' : 0, 'relation' : 0 },
            'delete' : { 'node' : 0, 'way' : 0, 'relation' : 0 }
        };

        // populate object
        Object.keys(this.diffInfo).forEach( data => {
            let [changeType, element] = data.split('-');
            if (changeType in diffStats) {
                diffStats[changeType][element] = this.diffInfo[data];
            }
        });

        // convert object to list of arrays
        const dataList = Object.keys(diffStats).map( data => {
            return [data].concat(Object.values(diffStats[data]));
        });

        return dataList;
    }

    handleSubmit() {
        const params  = {},
              tagsCheck = this.form.select('.applyTags');

        params.folder     = this.jobId;
        params.APPLY_TAGS = tagsCheck ? tagsCheck.property('checked') : false;

        Hoot.api.differentialPush( params )
            .then( resp => Hoot.message.alert( resp ) )
            .catch( err => {
                Hoot.message.alert( err );
                return false;
            } );

        this.form.remove();
    }
}
