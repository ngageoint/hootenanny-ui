/*******************************************************************************************************
 * File: addBasemap.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/6/18
 *******************************************************************************************************/

import _forEach from 'lodash-es/forEach';

import FormFactory        from '../../tools/formFactory';
import { basemapAddForm } from '../../config/domMetadata';

export default class AddBasemap {
    constructor( instance ) {
        this.instance = instance;
        this.form     = basemapAddForm.call( this );
    }

    render() {
        let metadata = {
            title: 'Publish New Basemaps',
            form: this.form,
            button: {
                text: 'Publish',
                id: 'basemapAddBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'basemaps-add-form', metadata );

        this.fileInput    = d3.select( '#basemapFileImport' );
        this.fileIngest   = d3.select( '#ingestFileUploader' );
        this.nameInput    = d3.select( '#basemapName' );
        this.submitButton = d3.select( '#basemapAddBtn' );
    }

    handleMultipartChange() {
        let fileName = this.fileIngest.node().files[ 0 ].name,
            saveName = fileName.indexOf( '.' ) ? fileName.substring( 0, fileName.indexOf( '.' ) ) : fileName;

        this.fileInput.property( 'value', saveName );

        if ( !this.nameInput.property( 'value' ).length ) {
            this.nameInput.property( 'value', saveName );
        }

        this.updateButtonState();
    }

    validateTextInput( d ) {
        let target     = d3.select( `#${ d.id }` ),
            fieldValid = target.property( 'value' );

        target.classed( 'invalid', !fieldValid );
        this.updateButtonState();
    }

    updateButtonState() {
        let fileVal = this.fileInput.property( 'value' ),
            nameVal = this.nameInput.property( 'value' );

        let formValid = fileVal.length && nameVal.length;

        this.submitButton.node().disabled = !formValid;
    }

    handleSubmit() {
        let data = {
            INPUT_NAME: this.nameInput.property( 'value' ),
            formData: this.getFormData( this.fileIngest.node().files )
        };

        this.loadingState();

        Hoot.api.uploadBasemap( data )
            .then( () => {
                this.container.remove();
                this.instance.loadBasemaps();
            } )
            .catch( (err) => {
                console.error(err);
                let message = 'Error adding basemap',
                    type = err.type;

                Hoot.message.alert( { message, type } );

                this.submitButton.select('#importSpin').remove()
                this.submitButton.text('Publish')
                this.container.selectAll( 'input' )
                    .each( function() {
                        d3.select( this ).node().disabled = false;
                    } );
            });
    }

    getFormData( files ) {
        let formData = new FormData();

        _forEach( files, ( file, i ) => {
            formData.append( `basemapuploadfile${ i }`, file );
        } );

        return formData;
    }

    loadingState() {
        this.submitButton
            .select( 'span' )
            .text( 'Uploading...' );

        this.submitButton
            .append( 'div' )
            .classed( '_icon _loading float-right', true )
            .attr( 'id', 'importSpin' );

        this.container.selectAll( 'input' )
            .each( function() {
                d3.select( this ).node().disabled = true;
            } );
    }
}
