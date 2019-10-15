import FormFactory from './formFactory';

import { checkForUnallowedChar, formatBbox, uuidv4 } from './utilities';

export default class GrailPull {
    constructor( instance ) {
        this.instance = instance;
        this.maxFeatureCount = null;
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

        this.submitButton.property( 'disabled', false );

        this.loadingState(true);

        this.createTable();
    }

    async createTable() {
        const params = {
            BBOX: this.instance.bbox
        };

        if ( this.instance.overpassQueryContainer.select('input').property('checked') ) {
            params.customQuery = this.instance.overpassQueryContainer.select( 'textarea' ).property( 'value' );
        }

        const { data } = await Hoot.api.grailMetadataQuery( params );
        this.maxFeatureCount = +data.maxFeatureCount;

        const overpassStats = await Hoot.api.getOverpassStats( data.overpassQuery );

        this.loadingState(false);

        const csvValues = overpassStats.split('\n')[1],
              arrayValues = csvValues.split('\t');
        const rowData = [
            {label: 'node', count: +arrayValues[1]},
            {label: 'way', count: +arrayValues[2]},
            {label: 'relation', count: +arrayValues[3]},
            {label: 'total', count: +arrayValues[0]}
        ];

        let statsTable = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .classed( 'pullStatsInfo', true );

        let tbody = statsTable.append('tbody');

        let rows = tbody.selectAll('tr')
            .data(rowData)
            .enter()
            .append('tr');

        rows.append('td')
            .text( data => data.label );

        rows.append('td')
            .classed( 'strong', data => data.count > 0 )
            .classed( 'badData', data => data.label === 'total' && data.count > this.maxFeatureCount )
            .text( data => data.count );

        if (+arrayValues[0] > this.maxFeatureCount) {
            this.form.select( '.hoot-menu' )
                .insert( 'div', '.modal-footer' )
                .classed( 'badData', true )
                .text( `Max feature count of ${this.maxFeatureCount} exceeded` );

            this.submitButton.node().disabled = true;
        } else {
            this.submitButton.node().disabled = false;
        }

        this.layerNameTable( data );
    }

    layerNameTable( data ) {
        const self = this;
        const uuid = uuidv4().slice(0,6);

        let columns = [
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
            ingestLayers = [data.railsLabel, data.overpassLabel];

        ingestLayers.forEach( (layer, i) => {
            let tRow = tableBody
                .append( 'tr' )
                .attr( 'id', `row-${ i }` );
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

    handleSubmit() {
        const bbox = this.instance.bbox;

        if ( !bbox ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        const railsParams = {
            BBOX   : formatBbox( bbox ),
            input1 : this.form.select( '.outputName-0' ).property( 'value' )
        };

        const overpassParams = {
            BBOX   : formatBbox( bbox ),
            input1 : this.form.select( '.outputName-1' ).property( 'value' )
        };

        if ( this.instance.overpassQueryContainer.select('input').property('checked') ) {
            overpassParams.customQuery = this.instance.overpassQueryContainer.select( 'textarea' ).property( 'value' );
        }

        Promise.all([
                Hoot.api.grailPullOverpassToDb( overpassParams ),
                Hoot.api.grailPullRailsPortToDb( railsParams )
            ])
            .then( ( resp ) => {
                resp.forEach( jobResp => {
                    Hoot.message.alert( jobResp );
                });
            } )
            .then( () => Hoot.folders.refreshAll() )
            .then( () => {
                if (this.instance.bboxSelectType === 'secondaryLayerExtent') {
                    const loadedRef = Hoot.layers.findLoadedBy( 'refType', 'primary' );
                    // Remove reference layer if there is one
                    if ( loadedRef ) {
                        Hoot.layers.removeActiveLayer( loadedRef.id, 'reference', 'primary' );
                    }

                    // load newly pulled layer
                    let layerInfo = {
                        name: railsParams.input1,
                        id: Hoot.layers.findBy( 'name', railsParams.input1 ).id
                    };

                    return Hoot.ui.sidebar.forms.reference.submitLayer( layerInfo );
                }
            })
            .then( () => Hoot.events.emit( 'render-dataset-table' ) );


        let history = JSON.parse( Hoot.context.storage('history') );
        if ( history.bboxHistory.length >= 5 ) {
            // Removes oldest (last in list) bbox
            history.bboxHistory = history.bboxHistory.slice( 0, 4 );
        }
        history.bboxHistory.unshift( bbox );
        Hoot.context.storage( 'history', JSON.stringify( history ) );

        this.form.remove();
    }

    loadingState(isLoading) {

        this.submitButton
            .select( 'span' )
            .text( isLoading ? 'Loading Counts' : 'Submit' );


        if (isLoading){
            this.submitButton
                .append( 'div' )
                .classed( '_icon _loading float-right', true )
                .attr( 'id', 'importSpin' );

            this.submitButton.node().disabled = true;
        } else {
            this.submitButton.select('div').remove();
        }
    }
}
