import FormFactory           from '../../tools/formFactory';
import { exportAlphaShape } from '../../config/domMetadata';
import { select as d3_select } from 'd3-selection';

export default class ExportAlphaShape {
    constructor( d ) {
        this.data       = d.data;
        this.form       = exportAlphaShape.call( this );
    }

    render() {

        let metadata = {
            title: 'Export Alpha Shape',
            form: this.form,
            button: {
                text: 'Export',
                location: 'right',
                id: 'submitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'export-alpha-shape-form', metadata );

        this.submitButton = d3_select( `#${ metadata.button.id }` );
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
            .text( 'Cancel' );

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
                d3_select( this ).property('disabled', true);
            } );
    }

    cancelOrErrorState() {
        this.submitButton
            .select( 'span' )
            .text( 'Export' );

        this.submitButton.on( 'click', () => {
            this.handleSubmit();
        } );

        this.submitButton.selectAll( 'div._loading' )
            .remove();

        this.container.selectAll( 'input' )
            .each( function() {
                d3_select( this ).property('disabled', false);
            } );
    }

    /**
     * Validate user input to make sure it's a number
     *
     * @param d - element data
     */
    validateTextInput( d ) {
        let target           = d3_select( `#${ d.id }` ),
            str              = target.property('value'),
            valid            = true;

        if ( str.length && isNaN(str) ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    /**
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        this.submitButton.property('disabled', !this.formValid);
    }

    getAlpha() {
        return this.container.select('#alpha').property('value');
    }

    getBuffer() {
        return this.container.select('#buffer').property('value');
    }

    getAddToMap() {
        return this.container.select('#addToMap').property('checked');
    }

    async handleSubmit() {
        let self = this;

        this.loadingState();

        //get alpha shape
        var param = {
            input: self.data.id,
            inputtype: 'db',
            outputname: self.data.name,
            outputtype: 'alpha.geojson'
            // bounds: '', //This would be needed to setting an osm pull bounds,
            // so stray features don't make the task extent too big
        };

        if (self.getAlpha()) param.alpha = self.getAlpha();
        if (self.getBuffer()) param.buffer = self.getBuffer();
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
                    Hoot.context.layers().layer('data').geojson(gj.data, 'Alpha Shape');
                    Hoot.context.layers().layer('data').fitZoom();
                    Hoot.ui.navbar.toggleManagePanel();
                }
                return resp;
            } )
            .then( async resp => {
                if (resp.data && resp.data.status !== 'cancelled') {
                    await Hoot.api.saveDataset( self.jobId, param.outputname + '.' + param.outputtype);
                }
                return resp;
            } )
            .then( async resp => {
                let message;
                if (resp.data && resp.data.status === 'cancelled') {
                    message = 'Export alpha shape job cancelled';
                    this.cancelOrErrorState();
                } else {
                    message = 'Alpha shape geojson exported';
                    if (addToMap) message += ' and added to the map';
                    Hoot.events.emit( 'modal-closed' );
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

                this.cancelOrErrorState();

                let message = 'Error exporting alpha shape',
                    type = err.type,
                    keepOpen = true;

                if (err.data.commandDetail && err.data.commandDetail.length > 0 && err.data.commandDetail[0].stderr !== '') {
                    message = err.data.commandDetail[0].stderr;
                }

                Hoot.message.alert( { message, type, keepOpen } );
            } );
    }
}
