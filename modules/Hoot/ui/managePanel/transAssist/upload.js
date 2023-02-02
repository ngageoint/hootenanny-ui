/*******************************************************************************************************
 * File: upload.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/5/18
 *******************************************************************************************************/

export default class Upload {
    constructor( instance ) {
        this.instance = instance;
        this.schemaOptions = Hoot.translations.availableTranslations.map(v => {
            let option = {
                name: v,
                enabled: true
            };
            if (v === 'OSM') {
                option.checked = true;
            }
            return option;
        });

        this.uploadButtons = [
            {
                title: 'Upload File(s)',
                icon: 'play_for_work',
                uploadType: 'FILE',
                multiple: true,
                accept: '.shp, .shx, .dbf, .zip, .geojson, .gpkg'
            },
            {
                title: 'Upload Folder',
                icon: 'move_to_inbox',
                uploadType: 'DIR',
                multiple: false,
                webkitdirectory: '',
                directory: ''
            }
        ];
    }

    render() {
        this.createUploadForm();
        this.createSchemaSelector();
        this.createUploadButtons();
    }

    createUploadForm() {
        this.uploadForm = this.instance.panelWrapper
            .append( 'form' )
            .classed( 'ta-upload-form round keyline-all fill-white', true );
    }

    createSchemaSelector() {
        let schema = this.uploadForm
            .append( 'div' )
            .classed( 'ta-schema-select fill-dark0 keyline-bottom', true );

        schema
            .append( 'label' )
            .classed( 'inline', true )
            .html( 'Tag Schema' );

        let schemaOpts = schema
            .selectAll( 'span' )
            .data( this.schemaOptions )
            .enter()
            .append( 'span' )
            .classed( 'inline pad0', true );

        schemaOpts
            .append( 'input' )
            .classed( 'inline schema-option', true )
            .attr( 'type', 'radio' )
            .attr( 'name', 'schema' )
            .attr( 'id', d => d.name )
            .attr( 'value', d => d.name )
            .property( 'disabled', d => !d.enabled )
            .property( 'checked', d => d.checked );

        schemaOpts
            .append( 'label' )
            .classed( 'inline', true )
            .attr( 'for', d => d.name )
            .html( d => d.name );
    }

    createUploadButtons() {
        let that = this;

        let buttonContainer = this.uploadForm
            .append( 'div' )
            .classed( 'button-row pad2', true )
            .selectAll( 'button' )
            .data( this.uploadButtons );

        let buttons = buttonContainer
            .enter()
            .append( 'button' )
            .attr( 'type', 'button' )
            .classed( 'primary text-light big', true )
            .on( 'click', function() {
                d3.select( this ).select( 'input' ).node().click();
            } );

        buttons
            .append( 'input' )
            .attr( 'type', 'file' )
            .attr( 'name', 'taFiles' )
            .attr( 'multiple', d => d.multiple )
            .attr( 'accept', d => d.accept && d.accept )
            .attr( 'webkitdirectory', d => d.webkitdirectory && d.webkitdirectory )
            .attr( 'directory', d => d.directory && d.directory )
            .classed( 'hidden', true )
            .on( 'click', () => d3.event.stopPropagation() )
            .on( 'change', function( d ) {
                that.processSchemaData( d3.select( this ).node(), d.uploadType );
            } );

        buttons
            .append( 'i' )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        buttons
            .append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );
    }

    async processSchemaData( input, type ) {
        let formData = new FormData();

        for ( let i = 0; i < input.files.length; i++ ) {
            let file = input.files[ i ];
            formData.append( i, file );
        }

        // reset the file input value so on change will fire
        // if the same files/folder is selected twice in a row
        input.value = null;

        return Hoot.api.uploadSchemaData( type, formData )
            .then( resp => {
                this.loadingState(d3.select(input.parentElement), true);

                this.jobId = resp.data.jobId;

                return Hoot.api.statusInterval( this.jobId );
            } )
            .then( resp => {
                let message;
                if (resp.data && resp.data.status === 'cancelled') {
                    message = 'Translation Assistant job cancelled';
                } else {
                    message = 'Translation Assistant job completed';
                }

                Hoot.message.alert( {
                    data: resp.data,
                    message: message,
                    status: 200,
                    type: resp.type
                } );

                return resp;
            } )
            .then( async (resp) => {
                if (resp.data && resp.data.status !== 'cancelled') {
                    const attrValues = await Hoot.api.getSchemaAttrValues( this.jobId );
                    const valuesMap = this.convertUniqueValues( attrValues );
                    this.instance.initMapping( valuesMap );
                }
            } )
            .catch( err => {
                console.error( err );
                let message = 'Error running Translation Assistant',
                    status = err.status,
                    type = err.type;

                return Promise.reject( { message, status, type } );
            } )
            .finally( () => {
                this.loadingState(d3.select(input.parentElement), false);
            } );
    }

    convertUniqueValues( json ) {
        let obj = {};

        d3.values( json ).forEach( v => {
            d3.entries( v ).forEach( e => {
                let map = d3.map();

                d3.entries( e.value ).forEach( a => {
                    // Omit empty fields
                    if ( a.value.length ) {
                        map.set( a.key, d3.set( a.value ) );
                    }
                } );

                obj[ e.key ] = map;
            } );
        } );

        return obj;
    }

    loadingState(submitButton, isLoading) {
        const text = isLoading ? 'Cancel Upload' : submitButton.data()[0].title;

        submitButton
            .select( 'span' )
            .text( text );

        const spinnerId = 'importSpin';
        if (isLoading) {
            // overwrite the submit click action with a cancel action
            submitButton.on( 'click', () => {
                Hoot.api.cancelJob(this.jobId);
            } );

            submitButton
                .append( 'div' )
                .classed( '_icon _loading float-right', true )
                .attr( 'id', spinnerId );
        } else {
            // reattach old click event
            submitButton.on('click', function() {
                submitButton.select( 'input' ).node().click();
            });

            submitButton
                .select(`#${ spinnerId }`)
                .remove();
        }
    }
}
