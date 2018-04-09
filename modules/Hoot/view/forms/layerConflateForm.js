/*******************************************************************************************************
 * File: layerConflateForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/5/18
 *******************************************************************************************************/

import _                     from 'lodash-es';
import FolderManager         from '../../managers/folderManager';
import LayerManager          from '../../managers/layerManager';
import Conflate              from '../../control/conflate';
import API                   from '../../control/api';
import FormFactory           from '../models/formFactory';
//import { d3combobox }        from '../../../lib/hoot/d3.combobox';
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

        this.saveAsInput         = d3.select( '#conflateSaveAs' );
        this.typeInput           = d3.select( '#conflateType' );
        this.refLayerInput       = d3.select( '#conflateRefLayer' );
        this.collectStatsInput   = d3.select( '#conflateCollectStats' );
        this.generateReportInput = d3.select( '#conflateGenerateReport' );

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

        if ( node.id === 'conflateSaveAs' && !str.length ) {
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

    preConflation( conflateCommand, advOpts ) {
        let data = {};

        data.TIME_STAMP         = new Date().getTime();
        data.CONFLATION_COMMAND = 'conflate';
        data.INPUT1             = LayerManager.findBy( 'type', 'primary' ).id;
        data.INPUT2             = LayerManager.findBy( 'type', 'secondary' ).id;
        data.INPUT1_TYPE        = 'DB';
        data.INPUT2_TYPE        = 'DB';
        data.OUTPUT_NAME        = this.saveAsInput.node().value;
        data.CONFLATION_TYPE    = this.typeInput.node().value;
        data.REFERENCE_LAYER    = this.refLayerInput.node().value;
        data.GENERATE_REPORT    = this.generateReportInput.node().value;
        data.COLLECT_STATS      = this.collectStatsInput.node().value;

        if ( advOpts ) {
            let advOptionsStr = '';

            _.each( advOpts, opt => {
                if ( advOptionsStr.length > 0 ) {
                    advOptionsStr += ' ';
                }
                advOptionsStr += `-D "${ opt.name }=${ opt.value }"`;
            } );

            data.ADV_OPTIONS = advOptionsStr;
        }
        return data;
    }

    postConflation() {

    }

    handleSubmit() {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        let data = this.preConflation();

        API.conflate( data )
            .then( resp => {
                console.log( resp );
            } );
    }
}

export default LayerConflateForm;