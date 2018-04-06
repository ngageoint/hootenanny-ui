/*******************************************************************************************************
 * File: layerConflateForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/5/18
 *******************************************************************************************************/

import _                     from 'lodash-es';
import FolderManager         from '../../models/folderManager';
import FormFactory           from './formFactory';
import { d3combobox }        from '../../../lib/hoot/d3.combobox';
import { layerConflateForm } from '../../config/formMetadata';

class LayerConflateForm {
    constructor( container ) {
        this.container   = container;
        this.formFactory = new FormFactory();
    }

    get exists() {
        return this.form;
    }

    render( layers ) {
        this.folderList = FolderManager.folderPaths;
        this.refLayers  = {
            primary: _.find( layers, layer => layer.type === 'primary' ),
            secondary: _.find( layers, layer => layer.type === 'secondary' )
        };

        this.formData = layerConflateForm.call( this, layers );

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

        this.innerWrapper = this.form.append( 'div' )
            .classed( 'inner-wrapper', true );

        this.fieldset = this.formFactory.createFieldSets( this.innerWrapper, this.formData );

        this.createLayerRefThumbnails( layers );
        this.createButtons();
    }

    createLayerRefThumbnails( layers ) {
        this.fieldset.insert( 'div', ':first-child' )
            .classed( 'conflate-ref center contain', true )
            .selectAll( '.thumb' )
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
                if ( window.confirm( 'Cancel will remove any previously selected advanced options. Are you sure you want to cancel?' ) ) {
                    this.toggleForm();
                }
            } );

        this.submitButton = actions.append( 'button' )
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
        let buttonState  = this.toggleButton.classed( 'active' ),
            wrapperState = this.innerWrapper.classed( 'visible' );

        this.toggleButton.classed( 'active', !buttonState );
        this.innerWrapper.classed( 'visible', !wrapperState );

        if ( buttonState ) {

        }
    }

    getSaveName( data ) {
        let newName = this.subCompare( data, 4 );

        if ( !newName.found ) {
            return 'Merged_' + Math.random().toString( 16 ).substring( 7 );
        }
        else {
            return 'Merged_' + newName.substring + '_' + Math.random().toString( 16 ).substring( 7 );
        }
    }

    subCompare( words, min_substring_length ) {
        let needle   = words[ 0 ].name,
            haystack = words[ 1 ].name;

        min_substring_length = min_substring_length || 1;

        for ( let i = needle.length; i >= min_substring_length; i-- ) {
            for ( let j = 0; j <= (needle.length - i); j++ ) {
                let substring = needle.substr( j, i ),
                    k         = haystack.indexOf( substring );

                if ( k !== -1 ) {
                    return {
                        found: 1,
                        substring: substring,
                        needleIndex: j,
                        haystackIndex: k
                    };
                }
            }
        }

        return {
            found: 0
        };
    }

    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'datasets', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
            valid = false;
        }

        if ( node.id === 'importDatasetLayerName' && !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    updateButtonState() {
        let self = this;

        this.form.selectAll( '.text-input' )
            .each( function() {
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    }

    handleSubmit() {

    }
}

export default LayerConflateForm;