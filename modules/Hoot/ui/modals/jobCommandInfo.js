import FormFactory from '../../tools/formFactory';

export default class JobCommandInfo {
    constructor( jobId ) {
        this.jobId = jobId;
    }

    render() {
        let metadata = {
            title: 'Job Command Info',
        };

        let formId = 'differentialPushTable';
        this.form  = new FormFactory().generateForm( 'body', formId, metadata );

        Hoot.api.getJobStatus( this.jobId )
            .then( resp => {
                let { stdout, stderr } = resp.commandDetail[ 0 ];
                this.stdout = stdout;
                this.stderr = stderr;

                this.createTable();
            } )
            .catch( err => {
                Hoot.message.alert( err );
                return false;
            } );
    }

    createTable() {
        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .attr( 'id', 'jobCommandInfo' );

        let colgroup = table
            .append( 'colgroup' );

        colgroup.append( 'col' )
            .attr( 'span', '1' );

        colgroup.append( 'col' )
            .style( 'width', '100px' );

        let tableBody = table.append( 'tbody' )
            .append( 'tr' );

        tableBody.append( 'td' )
            .classed( 'diffInfo', true )
            .text(this.stdout);


    }
}
