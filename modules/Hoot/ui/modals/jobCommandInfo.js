import FormFactory from '../../tools/formFactory';

export default class JobCommandInfo {
    constructor( jobId, poll ) {
        this.jobId = jobId;
        this.poll = poll;
    }

    render() {
        let metadata = {
            title: 'Job Log',
            form: [
                {
                    label: 'Console',
                    id: 'jobConsole',
                    placeholder: '',
                    readOnly: true,
                    inputType: 'textarea'
                },
                {
                    label: 'Verbose',
                    inputType: 'checkbox',
                    id: 'cboxVerbose',
                    onChange: () => this.loadCommands()
                }
            ]
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

    parseStatus( jobStatus, emptyCheck ) {
        const uuidRegex = '[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}';
        let verbose = false;
        let cbox = this.form.select('#cboxVerbose');

        if (cbox.size() > 0) {
            verbose = cbox.property('checked');
        }

        if ( emptyCheck ) {
            verbose = true;
        }

        // get all commands in 1 big string, seperate them by line, only use the ones marked at 'STATUS'
        return jobStatus.map( comm => {
                return ((verbose) ? 'COMMAND   ' + comm.command + '\n' : '') + comm.stdout;
            })
            .join('')
            .split('\n')
            .filter( command => {
                return verbose || /^STATUS/.test(command);
            })
            .map( command => {
                const replace = new RegExp(`^\\w+\\s+((${uuidRegex})?\\s?-?\\s?)`,'g');
                let line;
                if (verbose) {
                    line = command.replace('STATUS ', 'STATUS   ')
                                  .replace('   ', '\t');
                    let match = replace.exec(command);
                    if (match) line = line.replace(match[1], '');
                } else {
                    line = command.replace( replace, '' );
                }
                return line;
            })
            .join('\n');
    }

    loadCommands() {
        Hoot.api.getJobStatus( this.jobId )
            .then( resp => {
                this.commands = this.parseStatus(resp.commandDetail);
                // this.createTable();

                if ( this.commands !== '' ) {
                    this.form.select('#jobConsole').text(this.commands);
                }
                else {
                    this.commands = this.parseStatus(resp.commandDetail, 'basemap' );
                    this.form.select('#jobConsole').text(this.commands);
                }

                if (resp.status === 'complete') {
                    this.deactivate();
                }
            } )
            .catch( err => {
                Hoot.message.alert( err );
                this.deactivate();
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
