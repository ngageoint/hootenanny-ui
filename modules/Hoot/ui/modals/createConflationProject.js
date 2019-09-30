import _find from 'lodash-es/find';
import _get  from 'lodash-es/get';

import FormFactory           from '../../tools/formFactory';
// import { modifyDatasetForm } from '../../config/domMetadata';

export default class CreateConflationProject {
    constructor( d ) {
        this.data       = d.data;
        // this.form       = modifyDatasetForm.call( this );
    }

    render() {

        let metadata = {
            title: 'Create Conflation Project',
            form: this.form,
            button: {
                text: 'Generate Task Grid',
                location: 'right',
                id: 'createSubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'create-conflation-project-form', metadata );

        this.submitButton = d3.select( `#${ metadata.button.id }` );
        this.submitButton.property( 'disabled', false );

        let container = this.container;
        Hoot.events.once( 'modal-closed', () => {
            container.remove();
        });

        return this;
    }

    loadingState() {
        this.submitButton
            .select( 'span' )
            .text( 'Cancel Job' );

        // overwrite the submit click action with a cancel action
        this.submitButton.on( 'click', () => {
            Hoot.api.cancelJob(this.jobId);
        } );

        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.container.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );
    }

    async handleSubmit() {
        let self = this;

        this.loadingState();

        this.processRequest = Hoot.api.getMbr(this.data.id)
            .then( function(mbr) {
                //get task geojson
                var param = {
                    input: self.data.id,
                    inputtype: 'db',
                    outputtype: 'tiles.geojson',
                    TASK_BBOX: '',
                    MAX_NODE_COUNT_PER_TILE: 50000,
                    PIXEL_SIZE: 0.0001
                };

                Hoot.api.generateTaskGrid(param)
                    .then( resp => {
                        self.jobId = resp.data.jobid;

                        return Hoot.api.statusInterval( self.jobId );
                    } )
                    .then( async resp => {
                        if (resp.data && resp.data.status !== 'cancelled') {
                            let gj = await Hoot.api.fetchTaskGrid( self.jobId );
                            console.log(JSON.stringify(gj.data));
                            //View the grid on the map
Hoot.context.layers().layer('data').geojson(gj.data, 'Conflation Task Grid');
Hoot.context.layers().layer('data').fitZoom();
                            //Create conflation project
                        }
                        return resp;
                    } )
                    .then( resp => {
                        let message;
                        if (resp.data && resp.data.status === 'cancelled') {
                            message = 'Generate task grid job cancelled';
                        } else {
                            message = 'Conflation task grid generated';
                        }

                        Hoot.message.alert( {
                            data: resp.data,
                            message: message,
                            status: 200,
                            type: resp.type
                        } );

                        return resp;
                    } )
                    .catch( (err) => {
                        console.error(err);

                        let message = 'Error running generate task grid',
                            type = err.type,
                            keepOpen = true;

                        if (err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                            message = err.data.commandDetail[0].stderr;
                        }

                        Hoot.message.alert( { message, type, keepOpen } );
                    } );
            } )

    }
}
