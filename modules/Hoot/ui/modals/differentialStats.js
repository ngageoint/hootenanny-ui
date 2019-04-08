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
        let columns = [
            {
                label: 'Data Info',
                name: 'diffInfo'
            },
            {
                label: 'Apply Tag Differential?',
                name: 'applyTags'
            }
        ];

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

        tableBody.append( 'td' )
            .classed( 'diffInfo', true )
            .text(
                `Node Count: ${ this.diffInfo.nodeCount } \n` +
                `Way Count: ${ this.diffInfo.wayCount } \n` +
                `Relation Count: ${ this.diffInfo.relationCount }`
            );

        tableBody.append( 'td' )
            .append( 'input' )
            .attr( 'type', 'checkbox' )
            .property( 'checked', false )
            .attr( 'class', 'applyTags' );
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
