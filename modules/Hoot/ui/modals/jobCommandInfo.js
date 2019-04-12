import FormFactory from '../../tools/formFactory';

export default class JobCommandInfo {
    constructor( jobId ) {
        this.jobId = jobId;
    }

    render() {
        let metadata = {
            title: 'Job Logging',
        };

        let formId = 'jobCommandForm';
        this.form  = new FormFactory().generateForm( 'body', formId, metadata );

        Hoot.api.getJobStatus( this.jobId )
            .then( resp => {
                this.commands = resp.commandDetail;
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
            .insert( 'textarea' )
            .text(this.commands.map( comm => comm.stdout).join(''));
    }
}
