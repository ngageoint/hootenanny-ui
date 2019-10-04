import FormFactory           from '../../tools/formFactory';
import { exportTaskGrid } from '../../config/domMetadata';

export default class ExportTaskGrid {
    constructor( d ) {
        this.data       = d.data;
        this.form       = exportTaskGrid.call( this );
    }

    render() {

        let metadata = {
            title: 'Export Task Grid',
            form: this.form,
            button: {
                text: 'Export',
                location: 'right',
                id: 'submitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'export-task-grid-form', metadata );

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

    getMaxNodes() {
        return this.container.select('#maxnodes').property('value');
    }

    getPixelSize() {
        return this.container.select('#pxsize').property('value');
    }

    getAddToMap() {
        return this.container.select('#addToMap').property('checked');
    }

    async handleSubmit() {
        let self = this;

        this.loadingState();

        //get task geojson
        var param = {
            input: self.data.id,
            inputtype: 'db',
            outputname: self.data.name,
            outputtype: 'tiles.geojson'
            // TASK_BBOX: '', //This would be needed to setting an osm pull bounds,
            // so stray features don't make the task extent too big
        };

        if (self.getMaxNodes()) param.MAX_NODE_COUNT_PER_TILE = self.getMaxNodes();
        if (self.getPixelSize()) param.PIXEL_SIZE = self.getPixelSize();
        let addToMap = self.getAddToMap();

        Hoot.api.exportDataset(param)
            .then( resp => {
                self.jobId = resp.data.jobid;

                return Hoot.api.statusInterval( self.jobId );
            } )
            .then( async resp => {
                if (resp.data && resp.data.status !== 'cancelled' && addToMap) {
                    let gj = await Hoot.api.fetchGeojson( self.jobId, param.outputname, param.outputtype );
                    //View the grid on the map
                    Hoot.context.layers().layer('data').geojson(gj.data, 'Task Grid');
                    Hoot.context.layers().layer('data').fitZoom();
                    Hoot.ui.navbar.toggleManagePanel();
                }
                return resp;
            } )
            .then( async resp => {
                if (resp.data && resp.data.status !== 'cancelled') {
                    await Hoot.api.saveDataset( self.jobId, param.outputname );
                }
                return resp;
            } )
            .then( resp => {
                Hoot.events.emit( 'modal-closed' );
                return resp;
            })
            .then( async resp => {
                let message;
                if (resp.data && resp.data.status === 'cancelled') {
                    message = 'Export task grid job cancelled';
                } else {
                    message = 'Task grid geojson exported';
                    if (addToMap) message += ' and added to the map';
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

                let message = 'Error exporting conflation task grid',
                    type = err.type,
                    keepOpen = true;

                if (err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                    message = err.data.commandDetail[0].stderr;
                }

                Hoot.message.alert( { message, type, keepOpen } );
            } );
    }
}
