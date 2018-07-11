/*******************************************************************************************************
 * File: layerConflate.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/5/18
 *******************************************************************************************************/

import _                          from 'lodash-es';
import API                        from '../../managers/api';
import FolderManager              from '../../managers/folderManager';
import LayerManager               from '../../managers/layerManager';
import HootOSM                    from '../../managers/hootOsm';
import FormFactory                from '../../tools/formFactory';
import SidebarForm                from './sidebarForm';
import LayerAdvOpts               from './layerAdvOpts';
import { layerConflateForm }      from '../../config/formMetadata';
import { geoExtent as GeoExtent } from '../../../geo/index';

class LayerConflate extends SidebarForm {
    constructor( sidebar, container ) {
        super( sidebar, container );
        this.formFactory = new FormFactory();
    }

    render( layers ) {
        this.folderList = FolderManager.folderPaths;

        this.layers = {
            primary: _.find( layers, layer => layer.refType === 'primary' ),
            secondary: _.find( layers, layer => layer.refType === 'secondary' )
        };

        this.formData = layerConflateForm.call( this, layers );

        super.render();

        this.createFieldset();
        this.createLayerRefThumbnails( layers );
        this.createAdvancedOptions();
        this.createButtons();

        this.saveAsInput         = d3.select( '#conflateSaveAs' );
        this.typeInput           = d3.select( '#conflateType' );
        this.refLayerInput       = d3.select( '#conflateRefLayer' );
        this.collectStatsInput   = d3.select( '#conflateCollectStats' );
        this.generateReportInput = d3.select( '#conflateGenerateReport' );

        super.listen();
    }

    createFieldset() {
        this.fieldset = this.formFactory.createFieldSets( this.innerWrapper, this.formData );
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
            .classed( 'hoot-form-field action-container pill', true );

        actions.append( 'button' )
            .classed( 'button secondary round small strong', true )
            .text( 'Cancel' )
            .on( 'click', () => {
                if ( window.confirm( 'Cancel will remove any previously selected advanced options. Are you sure you want to cancel?' ) ) {
                    this.toggle();
                }
            } );

        this.submitButton = actions.append( 'button' )
            .classed( 'button dark text-light round small strong', true )
            .text( 'Conflate' )
            .on( 'click', () => this.handleSubmit() );
    }

    createAdvancedOptions() {
        this.advancedOptions = new LayerAdvOpts( this.context );
        this.advancedOptions.init();

        let advancedOptionsToggle = d3.select( '#advanced-opts-toggle' );

        advancedOptionsToggle.on( 'click', () => this.advancedOptions.toggle() );
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

            reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ],
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

    preConflation() {
        let data = {};

        data.TIME_STAMP         = '' + new Date().getTime();
        data.CONFLATION_COMMAND = 'conflate';
        data.INPUT1             = LayerManager.findLoadedBy( 'refType', 'primary' ).id;
        data.INPUT2             = LayerManager.findLoadedBy( 'refType', 'secondary' ).id;
        data.INPUT1_TYPE        = 'DB';
        data.INPUT2_TYPE        = 'DB';
        data.OUTPUT_NAME        = this.saveAsInput.node().value;
        data.CONFLATION_TYPE    = this.typeInput.node().value;
        data.REFERENCE_LAYER    = '1';
        data.GENERATE_REPORT    = this.generateReportInput.node().value;
        data.COLLECT_STATS      = this.collectStatsInput.node().value;
        data.ADV_OPTIONS        = this.advancedOptions.parsedOptions;
        data.USER_EMAIL         = 'test@test.com';

        let gj = this.context.layers().layer( 'gpx' );

        if ( gj.hasGpx() ) {
            let extent    = new GeoExtent( d3.geoBounds( gj.geojson() ) );
            data.TASK_BOX = extent.toParams();
        }

        return data;
    }

    postConflation( params ) {
        let layers = LayerManager.loadedLayers;

        _.each( layers, d => HootOSM.hideLayer( d.id ) );

        params.id     = LayerManager.findBy( 'name', params.name ).id;
        params.merged = true;
        params.layers = layers;

        this.loadLayer( params );
    }

    handleSubmit() {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        let data   = this.preConflation(),
            params = {
                name: data.OUTPUT_NAME,
                color: 'green',
                isConflate: true
            };

        // remove reference layer controllers
        d3.selectAll( '.add-controller' ).remove();

        if ( this.advancedOptions.isOpen ) {
            this.advancedOptions.toggle();
        }

        this.loadingState( params );

        API.conflate( data )
            .then( () => LayerManager.refreshLayers() )
            .then( () => this.postConflation( params ) );
    }
}

export default LayerConflate;