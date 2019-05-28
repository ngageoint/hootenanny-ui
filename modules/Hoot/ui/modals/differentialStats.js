import FormFactory from '../../tools/formFactory';

export default class DifferentialStats {
    constructor( jobId, data ) {
        this.jobId    = jobId;
        this.diffInfo = data;
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
        let columns = [
            {
                label: 'Data Stats',
                name: 'diffInfo'
            }
        ];

        if (hasTags) {
            columns.push({
                label: 'Apply Tag Differential?',
                name: 'applyTags'
            });
        }

        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .attr( 'id', 'diffPushTable' );

        let colgroup = table
            .append( 'colgroup' );

        colgroup.append( 'col' )
            .attr( 'span', '1' );

        colgroup.append( 'col' )
            .style( 'width', '100px' );

        table
            .append( 'thead' )
            .append( 'tr' )
            .selectAll( 'th' )
            .data( columns )
            .enter()
            .append( 'th' )
            .text( d => d.label );

        let tableBody = table.append( 'tbody' )
            .append( 'tr' );

        const diffStats = this.parseStats();

        const tableElement = tableBody.append( 'td' )
            .classed( 'diffInfo', true );
        this.infoGrid(tableElement, diffStats);

        if (hasTags) {
            tableBody.append( 'td' )
                .append( 'input' )
                .attr( 'type', 'checkbox' )
                .property( 'checked', false )
                .attr( 'class', 'applyTags' );
        }
    }

    infoGrid (tableElement, data) {
        let table = tableElement.append('table');
        let thead = table.append('thead');
        let tbody = table.append('tbody');

        const columns = ['', 'node', 'way', 'relation'];
        thead.append('tr')
            .selectAll('th')
            .data(columns)
            .enter()
            .append('th')
            .text(function (d) { return d; });

        let rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr');

        rows.selectAll('td')
            .data(function(row) {
                return row;
            })
            .enter()
            .append('td')
            .text(function (d) {
                return d; });

        return table;
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
        const params  = {};

        params.APPLY_TAGS = false;
        params.folder     = this.jobId;

        Hoot.api.differentialPush( params )
            .then( resp => Hoot.message.alert( resp ) )
            .catch( err => {
                Hoot.message.alert( err );
                return false;
            } );

        this.form.remove();
    }
}
