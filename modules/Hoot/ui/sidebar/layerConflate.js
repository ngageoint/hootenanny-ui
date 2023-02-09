/*******************************************************************************************************
 * File: layerConflate.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/5/18
 *******************************************************************************************************/

import _find    from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';

import SidebarForm                from './sidebarForm';
import AdvancedOpts               from './advancedOpts';
import FormFactory                from '../../tools/formFactory';
import { layerConflateForm }      from '../../config/domMetadata';
import { unallowableWordsExist } from '../../tools/utilities';

class LayerConflate extends SidebarForm {
    constructor( container, d ) {
        super( container, d );
    }

    async getData() {
        this.conflateTypes = await Hoot.api.getConflateTypes();
        const favOpts = await Hoot.api.getFavoriteAdvOpts();

        let sortOpts = [];

        Object.keys( favOpts ).forEach(( favName ) => {
            sortOpts.push( favName );
        });

        sortOpts.sort();

        sortOpts.map( opt => {
            if ( !this.conflateTypes.includes(opt) ) {
                this.conflateTypes.push( opt );
            }
        } );
    }

    render( layers ) {
        this.folderList = Hoot.folders.folderPaths;
        this.selectedLayers = {
            primary: _find( layers, layer => layer.refType === 'primary' ),
            secondary: _find( layers, layer => layer.refType === 'secondary' )
        };

        this.defaultFolderId = Hoot.layers.findBy('id', this.selectedLayers.primary.id).folderId
                    || Hoot.layers.findBy('id', this.selectedLayers.secondary.id).folderId;

        this.defaultFolder = _find( this.folderList, folder => folder.id === this.defaultFolderId);

        this.formData = layerConflateForm.call( this, layers );

        super.render();

        this.createFieldset();
        this.createLayerRefThumbnails( layers );
        this.createAdvancedOptions();
        this.createButtons();

        this.saveAsInput         = d3.select( '#conflateSaveAs' );
        this.folderPathInput     = d3.select( '#conflateFolderPath' );
        this.typeInput           = d3.select( '#conflateType' );
        this.algorithmInput      = d3.select( '#conflateAlgorithm' );
        this.refLayerInput       = d3.select( '#conflateRefLayer' );
        this.collectStatsInput   = d3.select( '#conflateCollectStats' );
    }

    createFieldset() {
        this.fieldset = new FormFactory().createFieldSets( this.innerWrapper, this.formData );
    }

    updateLayerColors(newColor, refType) {
        let thumb = this.fieldset.select(`.${refType}.thumb`);
        let oldColor = thumb.attr('class').split(' ').find(d => d.startsWith('fill-'));
        thumb.classed(`${ oldColor }`, false);
        thumb.classed(`fill-${ newColor }`, true);
    }

    checkForFavorite() {

        let defaultTypes = ['Reference', 'Attribute', 'Differential', 'Differential w/Tags', 'Horizontal', 'Network'];

        let currentType = this.typeInput.property('value');

        if ( !defaultTypes.includes( currentType ) ) {

        Hoot.getAllUsers();

        let allFavorites = Hoot.config.users[Hoot.user().id].members;

        let currentFavorites = [];

        Object.keys(allFavorites)
            .forEach( function(key) {
                if ( key === currentType ) {
                    currentFavorites.push( JSON.parse( allFavorites[key] ) );
                }
            } );

        return currentFavorites[0].conflateType;

        }
        else {
            return d3.select('#conflateType').property('value');
        }
    }

    createLayerRefThumbnails( layers ) {
        this.fieldset.insert( 'div', ':first-child' )
            .classed( 'conflate-ref center contain', true )
            .selectAll( '.thumb' )
            .data( layers ).enter()
            .append( 'div' )
            .attr( 'class', d => `${d.refType} thumb round _icon data light contain inline fill-${ d.color }` );
    }

    createButtons() {
        let actions = this.fieldset.append( 'div' )
            .classed( 'hoot-form-field action-container pill', true );

        actions.append( 'button' )
            .classed( 'button secondary round small strong', true )
            .text( 'Cancel' )
            .on( 'click', async () => {
                let message = 'All changes will be undone. Are you sure you want to cancel?',
                    confirm = await Hoot.message.confirm( message );

                if ( confirm ) {
                    this.toggle();
                }
            } );

        this.submitButton = actions.append( 'button' )
            .classed( 'button dark text-light round small strong', true )
            .text( 'Conflate' )
            .on( 'click', (d3_event) => this.handleSubmit(d3_event) );
    }

    async createAdvancedOptions() {
        this.advancedOptions = AdvancedOpts.getInstance();
        await this.advancedOptions.init();

        d3.select( '#advanced-opts-toggle' )
            .on( 'click', () => this.advancedOptions.toggle() );
    }

    getSaveName( data ) {
        let newName = this.subCompare( data, 4 );

        if ( !newName.found ) {
            return 'Merged_' + Math.random().toString( 16 ).substring( 7 );
        }
        else {
            return Hoot.layers.checkLayerName('Merged_' + newName.substring);
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

            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( unallowableWordsExist( str ) || unallowedPattern.test( str ) ) {
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

        data.INPUT1             = Hoot.layers.findLoadedBy( 'refType', 'primary' ).id;
        data.INPUT2             = Hoot.layers.findLoadedBy( 'refType', 'secondary' ).id;
        data.INPUT1_TYPE        = 'DB';
        data.INPUT2_TYPE        = 'DB';
        data.OUTPUT_NAME        = Hoot.layers.checkLayerName(this.saveAsInput.property( 'value' ));
        data.OUTPUT_FOLDER      = parseInt(this.folderPathInput.attr( '_value' ), 10);
        data.REFERENCE_LAYER    = (Hoot.layers.findLoadedBy( 'name', this.refLayerInput.node().value).refType === 'primary') ? '1' : '2';
        data.COLLECT_STATS      = this.collectStatsInput.property( 'value' );
        data.DISABLED_FEATURES  = this.advancedOptions.getDisabledFeatures();
        data.CONFLATION_TYPE    = this.checkForFavorite(); //this.typeInput.property( 'value' ).replace( /(Cookie Cutter & | w\/ Tags)/, '' );
        data.HOOT_2             = true;

        let { advanced, cleaning } = this.advancedOptions.getOptions();
        data.HOOT2_ADV_OPTIONS = advanced;
        data.CLEANING_OPTIONS = cleaning;

        switch ( data.CONFLATION_TYPE ) {
            case 'Differential': {
                data.CONFLATION_COMMAND = 'conflate-differential';
                break;
            }
            case 'Differential w/Tags': {
                data.CONFLATION_TYPE = 'Differential';
                data.CONFLATION_COMMAND = 'conflate-differential-tags';
                break;
            }
            default: {
                data.CONFLATION_COMMAND = 'conflate';
            }
        }

        if ( data.HOOT2_ADV_OPTIONS.hasOwnProperty( 'RoadEngines' ) &&
                data.HOOT2_ADV_OPTIONS.RoadEngines === 'Network' &&
                !data.DISABLED_FEATURES.includes( 'Roads' ) ) {
            data.CONFLATION_ALGORITHM = 'Network';
            delete data.HOOT2_ADV_OPTIONS.RoadEngines;
        }


        //If a task grid is present in custom data, use it to restrict conflation
        let customDataLayer = Hoot.context.layers().layer('data');
        let refBounds = Hoot.layers.findBy( 'id', data.INPUT1 ).bounds;
        let secBounds = Hoot.layers.findBy( 'id', data.INPUT2 ).bounds;
        if ( customDataLayer.hasData() && customDataLayer.enabled() ) {
            data.bounds = customDataLayer.getCoordsString();
        } else if (refBounds) { //the reference layer has a bounds property indicating data is constrained via API pull
            data.bounds = refBounds;
        } else if (secBounds) { //if no ref bounds, use the secondary bounds
            data.bounds = secBounds;
        }

        return data;
    }

    postConflation( params ) {
        let layers = Hoot.layers.loadedLayers;


        _forEach( layers, d => Hoot.layers.hideLayer( d.id ) );
        //handle layer not found here
        params.id     = Hoot.layers.findBy( 'name', params.name ).id;
        params.refType = 'merged';
        params.isMerged = true;
        params.layers = layers;
        params.active = true;
        Hoot.layers.loadLayer( params );
    }

    handleSubmit(d3_event) {
        d3_event.stopPropagation();
        d3_event.preventDefault();

        let data   = this.preConflation(),
            layerParams = {
                name: data.OUTPUT_NAME,
                color: 'green',
                isConflating: true,
                isMerged: true
            };

        if ( this.advancedOptions.isOpen ) {
            this.advancedOptions.toggle();
        }


        let refLayer = Hoot.layers.findLoadedBy( 'refType', 'primary' );
        let secLayer = Hoot.layers.findLoadedBy( 'refType', 'secondary' );

        // Check if either layer has task manager tag data
        if ( refLayer.tags && refLayer.tags.taskInfo ) {
            data.taskInfo = refLayer.tags.taskInfo;
        } else if ( secLayer.tags && secLayer.tags.taskInfo ) {
            data.taskInfo = secLayer.tags.taskInfo;
        }

        return Hoot.api.conflate( data )
            .then( resp => {
                layerParams.jobId = resp.data.jobid;

                this.loadingState( layerParams );

                // hide input layer controllers
                this.controller.hideInputs();

                return Hoot.api.statusInterval( resp.data.jobid );
            })
            .then( resp => {
                let message;
                if (resp.data && resp.data.status === 'cancelled') {
                    message = 'Conflation job cancelled';
                } else {
                    message = 'Conflation job complete';
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
                    await Hoot.folders.refreshAll();
                    Hoot.events.emit( 'render-dataset-table' );
                }
                return resp;
            } )
            .then( (resp) => {
                if (resp.data && resp.data.status !== 'cancelled') {
                    // remove input layer controllers
                    d3.selectAll( '.add-controller' ).remove();

                    this.postConflation( layerParams );
                }
            } )
            .catch( err => {
                console.error(err);
                let message, status, type, keepOpen = true;

                status = err.status;
                type   = err.type;

                // check for services error
                if (status >= 400 && status < 500) {
                    message = err.data.split('\n')[0];
                } else if (status >= 500) { // check for command line error
                    message = err.data.commandDetail[0].stderr;
                } else {
                    message = 'Error running conflation';
                }

                if ( !type ) {
                    type = 'error';
                }

                // restore input layer controllers
                this.controller.restoreInputs();

                Hoot.message.alert( { message, type, keepOpen } );

            } );
    }

    forceAdd( params ) {
        this.createForm();
        this.loadingState( params );
    }
}

export default LayerConflate;
