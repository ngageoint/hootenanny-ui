import _map from 'lodash-es/map';

import FormFactory from './formFactory';

import { uuidv4, formatBbox } from './utilities';
import { d3combobox }         from '../../lib/hoot/d3.combobox';
import _forEach               from 'lodash-es/forEach';

export default class ConflationUpload {
    constructor( instance ) {
        this.instance = instance;
    }

    render() {
        let titleText = 'Push Conflation Results to Database';

        let metadata = {
            title: titleText,
            button: {
                text: 'Run Conflation Upload',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'conflationUploadTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3.select( `#${metadata.button.id}` );

        this.submitButton.property( 'disabled', false );

        this.createTable();
    }

    createTable() {
        let loadedLayers = Hoot.layers.loadedLayers;

        let columns = [
            {
                label: 'Dataset Name',
                name: 'datasetName'
            },
            {
                label: 'Select Input 1',
                name: 'inputSelection'
            }
        ];

        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .attr( 'id', 'differentialTable' );

        let colgroup = table
            .append( 'colgroup' );

        colgroup.append( 'col' )
            .attr( 'span', '1' );

        colgroup.append( 'col' )
            .style( 'width', '100px' );

        table
            .append( 'thead' )
            .append( 'tr' )
            .selectAll( 'th' )
            .data( columns )
            .enter()
            .append( 'th' )
            .text( d => d.label );

        let tableBody = table.append( 'tbody' );

        _forEach( loadedLayers, layer => {
            let mapId = layer.id;

            tableBody
                .append( 'tr' )
                .attr( 'id', `row-${ mapId }` )
                .selectAll( 'td' )
                .data( columns )
                .enter()
                .append( 'td' )
                .append( 'input' )
                .attr( 'type', 'text' )
                .attr( 'data-map-id', mapId )
                .attr( 'class', d => d.name )
                .attr( 'placeholder', d => d.placeholder )
                .select( function( d ) {
                    if ( d.name === 'datasetName' ) {
                        d3.select( this )
                            .attr( 'placeholder', layer.name )
                            .attr( 'readonly', false );
                    } else if ( d.name === 'inputSelection' ) {
                        let parent = d3.select( this.parentElement );

                        parent
                            .selectAll( 'input' )
                            .remove();

                        parent
                            .append( 'input' )
                            .attr( 'type', 'checkbox' )
                            .property( 'checked', false )
                            .attr( 'data-map-id', mapId );
                    }
                } );
        } );
    }

    handleSubmit() {
        const loadedLayers = Hoot.layers.loadedLayers,
              checkedRow   = this.form.select( '[type="checkbox"]:checked' ),
              uncheckedRow = this.form.select( '[type="checkbox"]:not(:checked)' ),
              params       = {};

        params.input1 = loadedLayers[ checkedRow.attr( 'data-map-id' ) ].name;
        params.input2 = loadedLayers[ uncheckedRow.attr( 'data-map-id' ) ].name;

        Hoot.api.conflationUpload( params )
            .then( ( resp ) => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
