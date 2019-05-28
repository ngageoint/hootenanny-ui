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

    parseStatus( jobStatus ) {
        const uuidRegex = '[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}';

        // get all commands in 1 big string, seperate them by line, only use the ones marked at 'STATUS'
        return jobStatus.map( comm => comm.stdout)
            .join('')
            .split('\n')
            .filter( command => {
                return /^STATUS/.test(command);
            })
            .map( command => {
                const replace = new RegExp(`^STATUS\\s+${uuidRegex}\\s+-\\s+`,'g');
                return command.replace( replace, '' );
            })
            .join('\n');
    }

    loadCommands() {
        Hoot.api.getJobStatus( this.jobId )
            .then( resp => {
                this.commands = this.parseStatus(resp.commandDetail);
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
            .text(this.commands);

        if (ta.node()) {
            ta.node().scrollTop = ta.node().scrollHeight;
        }
    }
}
