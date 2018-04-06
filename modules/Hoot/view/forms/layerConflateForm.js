/*******************************************************************************************************
 * File: layerConflateForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/5/18
 *******************************************************************************************************/

import FolderManager         from '../../models/folderManager';
import FormFactory           from './formFactory';
import { layerConflateForm } from '../../config/formMetadata';

class LayerConflateForm {
    constructor( container ) {
        this.container   = container;
        this.folderList  = FolderManager.folderPaths;
        this.formData    = layerConflateForm.call( this );
        this.formFactory = new FormFactory();
    }

    get exists() {
        return this.form;
    }

    render( layers ) {
        this.form = this.container.select( '.wrapper' )
            .append( 'form' )
            .classed( 'sidebar-form layer-conflate round fill-white strong', true );

        this.toggleButton = this.form.append( 'a' )
            .classed( 'toggle-button strong round _icon conflate big light', true )
            .attr( 'href', '#' )
            .on( 'click', () => this.toggleForm() );

        this.toggleButton.append( 'span' )
            .classed( 'strong', true )
            .text( 'Conflate' );

        this.fieldset = this.formFactory.createFieldSets( this.form, this.formData, true );

        this.createLayerRefThumbnails( layers );
        this.createButtons();
    }

    createLayerRefThumbnails( layers ) {
        let layerRef = this.fieldset.insert( 'div', ':first-child' )
            .classed( 'conflate-ref center contain', true );

        layerRef.selectAll( '.thumb' )
            .data( layers ).enter()
            .append( 'div' )
            .attr( 'class', d => `thumb round _icon data light contain inline fill-${ d.color }` );
    }

    createButtons() {
        let actions = this.fieldset.append( 'div' )
            .classed( 'form-field action-container pill', true );

        actions.append( 'button' )
            .classed( 'button secondary round small strong', true )
            .text( 'Cancel' )
            .on( 'click', () => {
                if (window.confirm('Cancel will remove any previously selected advanced options. Are you sure you want to cancel?')){
                    this.toggleForm();
                }
            } );

        actions.append( 'button' )
            .classed( 'button dark text-light round small strong', true )
            .text( 'Conflate' )
            .on( 'click', () => this.handleSubmit() );
    }

    remove() {
        if ( this.exists ) {
            this.form.remove();
            this.form = null;
        }
    }

    toggleForm() {
        let buttonState   = this.toggleButton.classed( 'active' ),
            fieldsetState = this.fieldset.classed( 'hidden' );

        this.toggleButton.classed( 'active', !buttonState );
        this.fieldset.classed( 'hidden', !fieldsetState );

        if ( buttonState ) {

        }
    }

    handleSubmit() {

    }
}

export default LayerConflateForm;