import FormFactory from './formFactory';

import { checkForUnallowedChar, uuidv4 } from './utilities';
import _find                                         from 'lodash-es/find';
import OverpassQueryPanel                            from './overpassQueryPanel';
import _get                                          from 'lodash-es/get';
import { prefs } from '../../core';
import { select as d3_select } from 'd3-selection';

export default class GrailPull {
    constructor( instance ) {
        this.instance = instance;
        this.extentType = this.instance.boundsSelectType;
        this.privateOverpassActive = false;
    }

    render() {
        let titleText = 'Pull Remote Data';

        if ( this.extentType !== 'boundsHistory' ) {
            // capitalizes the first character and splits the string at each capital letter such that
            // 'customDataExtent' becomes 'Custom Data Extent'
            titleText += ' for ' + this.extentType[0].toUpperCase() + this.extentType.slice(1).split(/(?=[A-Z])/).join(' ');
        }

        let metadata = {
            title: titleText,
            button: {
                text: 'Submit',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'grailPullTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3_select( `#${ metadata.button.id }` );

        this.addBackButton( metadata.button.id );
        this.submitButton.property( 'disabled', false );

        this.loadingState();

        this.createTable();
    }

    addBackButton( nextButtonId ) {
        const backButton = this.form.select( '.modal-footer' )
            .insert( 'button', `#${ nextButtonId }` )
            .classed( 'round strong primary', true )
            .on( 'click', () => {
                this.form.remove();

                new OverpassQueryPanel( this.instance ).render();
            } );

        backButton.append( 'span' )
            .text( 'Back' );
    }

    async createTable() {
        const overpassParams = { bounds: this.instance.bounds };
        if ( this.instance.overpassQueryContainer.select( '#customQueryToggle' ).property( 'checked' ) ) {
            overpassParams.customQuery = this.instance.overpassQueryContainer.select( 'textarea' ).property( 'value' );
        }

        const rowData = await Hoot.api.overpassStats( overpassParams )
            .catch( () => {
                this.submitButton.node().disabled = true;

                this.form.select( '.wrapper div' )
                .insert( 'div', '.modal-footer' )
                .classed( 'show-newline', true )
                .text( 'Error retrieving overpass stats query!\nPlease wait and try again later' );
            } );

        this.loadingState();

        if ( !rowData ) return;

        let statsTable = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .classed( 'pullStatsInfo', true );


        let thead = statsTable.append('thead');
        thead.append('tr')
            .selectAll('th')
            .data([''].concat(rowData.columns.slice().reverse()))
            .enter()
            .append('th')
            .text(function (d) { return d; });

        let tbody = statsTable.append('tbody');
        let rows = tbody.selectAll('tr')
            .data(rowData.data)
            .enter()
            .append('tr');

        rows.append('td')
            .text( data => data.label );

        // add private overpass data first if exists
        if ( rowData.columns.length === 2 ) {
            this.privateOverpassActive = true;

            rows.append('td')
                .classed( 'strong', data => data[rowData.columns[1]] > 0 )
                .text( data => data[rowData.columns[1]] );
        }

        // column for public overpass counts
        rows.append('td')
            .classed( 'strong', data => data[rowData.columns[0]] > 0 )
            .text( data => data[rowData.columns[0]] );

        this.submitButton.node().disabled = false;

        this.layerNameTable();
    }

    layerNameTable() {
        const self = this;
        const uuid = uuidv4().slice(0,6);

        let columns = [
            {
                label: '',
                name: 'downloadDataset'
            },
            {
                label: 'Data Source',
                name: 'datasetName'
            },
            {
                label: 'Output Name',
                placeholder: 'Save As',
                name: 'outputName'
            }
        ];

        let layerOutputTable = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .classed( 'grailOutputTable', true );

        layerOutputTable.append( 'thead' )
            .append( 'tr' )
            .selectAll( 'th' )
            .data( columns )
            .enter()
            .append( 'th' )
            .text( d => d.label );

        let tableBody = layerOutputTable.append( 'tbody' ),
            ingestLayers = [Hoot.config.referenceLabel, Hoot.config.secondaryLabel];

        ingestLayers.forEach( (layer, i) => {
            let tRow = tableBody
                .append( 'tr' )
                .attr( 'id', `row-${ i }` );

            tRow.append( 'td' )
                .append( 'input' )
                .attr( 'type', 'checkbox' )
                .property( 'checked', true );

            tRow.append( 'td' )
                .append( 'label' )
                .text(layer);

            tRow.append( 'td' )
                .append( 'input' )
                .attr( 'type', 'text' )
                .attr( 'class', 'outputName-' + i )
                .attr( 'placeholder', 'Save As' )
                .select( function( ) {
                    const saveName = layer + '_' + uuid;

                    d3_select( this ).property( 'value', saveName )
                        .on( 'input', function() {
                            let resp = checkForUnallowedChar( this.value );
                            let dupName = Hoot.layers.findBy( 'name', this.value );

                            if ( dupName || resp !== true || !this.value.length ) {
                                d3_select( this ).classed( 'invalid', true ).attr( 'title', resp );
                                self.submitButton.property( 'disabled', true );
                            } else {
                                d3_select( this ).classed( 'invalid', false ).attr( 'title', null );
                                self.submitButton.property( 'disabled', false );
                            }
                        } );
                } );
        } );
    }

    async handleSubmit() {
        this.loadingState();

        const bounds = this.instance.bounds;

        if ( !bounds ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        let folderName,
            folderId,
            pathId,
            projectName;

        const railsParams = {
            bounds   : bounds,
            input1   : this.form.select( '.outputName-0' ).property( 'value' )
        };

        const overpassParams = {
            bounds   : bounds,
            input1   : this.form.select( '.outputName-1' ).property( 'value' )
        };

        if ( this.extentType === 'customDataExtent' &&
            sessionStorage.getItem('tm:project') && sessionStorage.getItem('tm:task') ) {
            /**
             * If we are coming from tasking manager, and we dont' have project folder, add it.
             */
            projectName = sessionStorage.getItem('tm:project');
            if (!_get(_find(Hoot.folders.myFolders, folder => folder.name === projectName), 'id')) {
                await Hoot.folders.addFolder('', projectName);
                await Hoot.folders.refreshFolders();
            }

            /**
             * Then make the folderName the taskname.
             */
            folderName = sessionStorage.getItem('tm:task');
            pathId = _get(_find(Hoot.folders.myFolders, folder => folder.name === folderName), 'id');
            if (!pathId) {
                folderId = (await Hoot.folders.addFolder(projectName || '', folderName, true )).folderId;
            } else {
                folderId = pathId;
            }

            railsParams.taskInfo = overpassParams.taskInfo = projectName + ', ' + folderName;
        } else {
            if ( this.extentType === 'customDataExtent' ) {
                folderName = 'grail_' + Hoot.context.layers().layer('data').getCustomName();
            } else {
                folderName = 'grail_' + bounds.replace(/,/g, '_');
            }

            pathId = _get(_find(Hoot.folders.folderPaths, folder => folder.name === folderName), 'id');
            if (!pathId) {
                folderId = (await Hoot.folders.addFolder('', folderName )).folderId;
            } else {
                folderId = pathId;
            }
        }

        if ( this.instance.overpassQueryContainer.select( '#customQueryToggle' ).property( 'checked' ) ) {
            const customQuery          = this.instance.overpassQueryContainer.select( 'textarea' ).property( 'value' );
            railsParams.customQuery    = customQuery;
            overpassParams.customQuery = customQuery;
        }

        // Check to see which datasets to pull
        const jobsList = [],
              referenceCheckbox = d3_select( '#row-0 input' ).property( 'checked' ),
              secondaryCheckbox = d3_select( '#row-1 input' ).property( 'checked' );
        if ( referenceCheckbox ) {
            jobsList.push( Hoot.api.grailPullRailsPortToDb( railsParams, folderId, Hoot.config.referenceLabel ) );
        }
        if ( secondaryCheckbox ) {
            jobsList.push( Hoot.api.grailPullOverpassToDb( overpassParams, folderId, Hoot.config.secondaryLabel ) );
        }

        Promise.all( jobsList )
            .then( ( resp ) => {
                resp.forEach( jobResp => {
                    Hoot.message.alert( jobResp );
                });
            } )
            .then( () => Hoot.folders.refreshAll() )
            .then( () => {
                const loadedPrimary   = Hoot.layers.findLoadedBy( 'refType', 'primary' ),
                      loadedSecondary = Hoot.layers.findLoadedBy( 'refType', 'secondary' );

                // Finding layer id by name is fine here because we check for duplicate name in the grail pull
                let refLayer = Hoot.layers.findBy( 'name', railsParams.input1 ),
                    secLayer = Hoot.layers.findBy( 'name', overpassParams.input1 ),
                    submitPromises = [];

                if ( referenceCheckbox && refLayer ) {
                    // Remove reference layer if there is one
                    if ( loadedPrimary ) {
                        Hoot.layers.removeActiveLayer( loadedPrimary.id, 'reference', 'primary' );
                    }

                    let refParams = {
                        name: railsParams.input1,
                        id: refLayer.id,
                        color: 'violet',
                        refType: 'primary'
                    };

                    submitPromises.push( Hoot.ui.sidebar.forms.reference.submitLayer( refParams ) );
                }

                if ( secondaryCheckbox && secLayer ) {
                    // Remove secondary layer if there is one
                    if ( loadedSecondary ) {
                        Hoot.layers.removeActiveLayer( loadedSecondary.id, 'secondary', 'secondary' );
                    }

                    let secParams = {
                        name: overpassParams.input1,
                        id: secLayer.id,
                        color: 'orange',
                        refType: 'secondary'
                    };

                    submitPromises.push( Hoot.ui.sidebar.forms.secondary.submitLayer( secParams ) );
                }

                return Promise.all( submitPromises );
            } )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .then( () => this.form.remove() );


        let boundsHistory = JSON.parse( prefs('bounds_history') );
        if ( boundsHistory.boundsHistory.length >= 5 ) {
            // Removes oldest (last in list) bounds
            boundsHistory.boundsHistory = boundsHistory.boundsHistory.slice( 0, 4 );
        }
        boundsHistory.boundsHistory.unshift( bounds );
        prefs( 'bounds_history', JSON.stringify( boundsHistory ) );

    }

    loadingState() {
        const overlay = this.form.select( '.grail-loading' );

        if ( !overlay.empty() ){
            overlay.remove();
        } else {
            // Add overlay with spinner
            this.form.select( '.wrapper div' )
                .insert( 'div', '.modal-footer' )
                .classed('grail-loading', true);
        }
    }
}
