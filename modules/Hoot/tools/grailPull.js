import FormFactory from './formFactory';

import { checkForUnallowedChar, formatBbox, uuidv4 } from './utilities';
import _find                                         from 'lodash-es/find';
import OverpassQueryPanel                            from './overpassQueryPanel';
import _get                                          from 'lodash-es/get';

export default class GrailPull {
    constructor( instance ) {
        this.instance = instance;
        this.maxFeatureCount = Hoot.config.maxFeatureCount;
    }

    render() {
        let titleText = this.instance.bboxSelectType === 'visualExtent'
            ? 'Pull Remote Data for Visual Extent'
            : this.instance.bboxSelectType === 'boundingBox'
                ? 'Pull Remote Data for Bounding Box'
                : 'Pull Remote Data';

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
        this.submitButton = d3.select( `#${ metadata.button.id }` );

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
        const overpassParams = { BBOX: this.instance.bbox };
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
            rows.append('td')
                .classed( 'strong', data => data[rowData.columns[1]] > 0 )
                .classed( 'badData', data => data.label === 'total' && data[rowData.columns[1]] > this.maxFeatureCount )
                .text( data => data[rowData.columns[1]] );
        }

        // column for public overpass counts
        rows.append('td')
            .classed( 'strong', data => data[rowData.columns[0]] > 0 )
            .classed( 'badData', data => data.label === 'total' && data[rowData.columns[0]] > this.maxFeatureCount )
            .text( data => data[rowData.columns[0]] );

        if ( rows.selectAll('td.badData').size() ) {
            this.form.select( '.hoot-menu' )
                .insert( 'div', '.modal-footer' )
                .classed( 'badData', true )
                .text( `Max feature count of ${this.maxFeatureCount} exceeded` );

            this.submitButton.node().disabled = true;
        } else {
            this.submitButton.node().disabled = false;
        }

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

                    d3.select( this ).property( 'value', saveName )
                        .on( 'input', function() {
                            let resp = checkForUnallowedChar( this.value );
                            let dupName = Hoot.layers.findBy( 'name', this.value );

                            if ( dupName || resp !== true || !this.value.length ) {
                                d3.select( this ).classed( 'invalid', true ).attr( 'title', resp );
                                self.submitButton.property( 'disabled', true );
                            } else {
                                d3.select( this ).classed( 'invalid', false ).attr( 'title', null );
                                self.submitButton.property( 'disabled', false );
                            }
                        } );
                } );
        } );
    }

    async handleSubmit() {
        this.loadingState();

        const bbox = this.instance.bbox;

        if ( !bbox ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        let folderName,
            folderId,
            pathId,
            projectName;

        const railsParams = {
            BBOX     : formatBbox( bbox ),
            input1   : this.form.select( '.outputName-0' ).property( 'value' )
        };

        const overpassParams = {
            BBOX     : formatBbox( bbox ),
            input1   : this.form.select( '.outputName-1' ).property( 'value' )
        };

        if (sessionStorage.getItem('tm:project') && sessionStorage.getItem('tm:task')) {
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
            folderName = 'grail_' + bbox.replace(/,/g, '_');
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
              referenceCheckbox = d3.select( '#row-0 input' ).property( 'checked' ),
              secondaryCheckbox = d3.select( '#row-1 input' ).property( 'checked' );
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

                // add grail pulled layers if nothing is on map
                if ( !loadedPrimary && !loadedSecondary ) {
                    let submitPromises = [];

                    // Finding layer id by name is fine here because we check for duplicate name in the grail pull
                    let refLayer = Hoot.layers.findBy( 'name', railsParams.input1 );
                    if ( referenceCheckbox && refLayer ) {
                        let refParams = {
                            name: railsParams.input1,
                            id: refLayer.id,
                            color: 'violet',
                            refType: 'primary'
                        };

                        submitPromises.push( Hoot.ui.sidebar.forms.reference.submitLayer( refParams ) );
                    }

                    let secLayer = Hoot.layers.findBy( 'name', overpassParams.input1 );
                    if ( secondaryCheckbox && secLayer ) {
                        let secParams = {
                            name: overpassParams.input1,
                            id: secLayer.id,
                            color: 'orange',
                            refType: 'secondary'
                        };

                        submitPromises.push( Hoot.ui.sidebar.forms.secondary.submitLayer( secParams ) );
                    }

                    return Promise.all( submitPromises );
                } else if (this.instance.bboxSelectType === 'secondaryLayerExtent') {
                    // Remove reference layer if there is one
                    if ( loadedPrimary ) {
                        Hoot.layers.removeActiveLayer( loadedPrimary.id, 'reference', 'primary' );
                    }

                    // load newly pulled layer
                    let layerInfo = {
                        name: railsParams.input1,
                        id: Hoot.layers.findBy( 'name', railsParams.input1 ).id
                    };

                    return Hoot.ui.sidebar.forms.reference.submitLayer( layerInfo );
                }
            } )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .then( () => this.form.remove() );


        let history = JSON.parse( Hoot.context.storage('history') );
        if ( history.bboxHistory.length >= 5 ) {
            // Removes oldest (last in list) bbox
            history.bboxHistory = history.bboxHistory.slice( 0, 4 );
        }
        history.bboxHistory.unshift( bbox );
        Hoot.context.storage( 'history', JSON.stringify( history ) );

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
