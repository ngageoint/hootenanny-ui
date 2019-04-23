import FormFactory from '../../tools/formFactory';

export default class JobCommandInfo {
    constructor( jobId, poll ) {
        this.jobId = jobId;
        this.poll = poll;
    }

    render() {
        let metadata = {
            title: 'Job Log',
        };

        let formId = 'jobCommandForm';
        this.form  = new FormFactory().generateForm( 'body', formId, metadata );

        this.loadCommands();

        if (this.poll)
            this.activate();
    }

    activate() {
        this.poller = window.setInterval( this.loadCommands.bind(this), 5000 );
    }

    deactivate() {
        window.clearInterval(this.poller);
    }

    loadCommands() {
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
        let ta = this.form
            .select( '.wrapper div' )
            .selectAll( 'textarea' )
            .data([0]);
        ta.exit().remove();
        ta.enter().append('textarea')
            .merge(ta)
            .text(this.commands.map( comm => comm.stdout).join(''));
        ta.node().scrollTop = ta.node().scrollHeight;
    }
}
