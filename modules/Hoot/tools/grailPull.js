import _map from 'lodash-es/map';

import FormFactory from './formFactory';

import { uuidv4, formatBbox } from './utilities';
import { d3combobox }         from '../../lib/hoot/d3.combobox';

export default class GrailPull {
    constructor( instance ) {
        this.instance = instance;
    }

    render() {
        let titleText = this.instance.bboxSelectType === 'visualExtent'
            ? 'Pull Data to Visual Extent'
            : this.instance.bboxSelectType === 'boundingBox'
                ? 'Pull Data to Bounding Box'
                : 'Pull Data';

        let metadata = {
            title: titleText,
            button: {
                text: 'Pull Data',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'grailPullTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3.select( `#${metadata.button.id}` );

        this.submitButton.property( 'disabled', false );

        this.createTable();
    }

    createTable() {
        let folderList = Hoot.folders.folderPaths,
            that       = this;

        let columns = [
            {
                label: 'OSM layer Name',
                placeholder: 'Save As',
                name: 'osmName'
            },
            {
                label: 'MapEdit layer Name',
                placeholder: 'Save As',
                name: 'mapeditName'
            },
            {
                label: 'Path',
                placeholder: 'root',
                combobox: folderList,
                name: 'outputPath'
            }
        ];

        let table = this.form
            .select( '.wrapper div' )
            .insert( 'table', '.modal-footer' )
            .attr( 'id', 'grailTable' );

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

        let tableBody    = table.append( 'tbody' ),
            ingestLayers = {
                osmName: `OpenStreetMap_${uuidv4().replace( /-/g, '' ).substring( 0, 10 )}`,
                mapeditName: `mapEdit_${uuidv4().replace( /-/g, '' ).substring( 0, 10 )}`
            };

        tableBody
            .append( 'tr' )
            .attr( 'id', d => `row-${ d }` )
            .selectAll( 'td' )
            .data( columns )
            .enter()
            .append( 'td' )
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'class', d => d.name )
            .attr( 'placeholder', d => ingestLayers[ d.name ] || '' )
            .select( function( d ) {
                if ( d.name === 'osmName' || d.name === 'mapeditName' ) {
                    d3.select( this )
                        .attr( 'value', ingestLayers[ d.name ] );
                } else {
                    that.createFolderListCombo( d3.select( this ), d );
                }
            } );
    }

    /**
     * Create folder list selection dropdown
     *
     * @param input - selected field
     * @param d     - field metadata
     **/
    createFolderListCombo( input, d ) {
        let combobox = d3combobox()
            .data( _map( d.combobox, n => {
                return {
                    value: n.path,
                    title: n.path
                };
            } ) );

        let data = combobox.data();

        data.sort( ( a, b ) => {
            let textA = a.value.toLowerCase(),
                textB = b.value.toLowerCase();

            return textA < textB ? -1 : textA > textB ? 1 : 0;
        } ).unshift( { value: 'root', title: 0 } );

        input.call( combobox );
        input.attr( 'placeholder', 'root' );
    }

    handleSubmit() {
        const bbox   = this.instance.bbox,
              params = {};

        if ( !bbox ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        let osmData     = this.form.select( '.osmName' ),
            mapEditData = this.form.select( '.mapeditName' ),
            path        = this.form.select( '.outputPath' );

        params.OSM_NAME     = osmData.property( 'value' ) || osmData.attr( 'placeholder' );
        params.MAPEDIT_NAME = mapEditData.property( 'value' ) || mapEditData.attr( 'placeholder' );
        params.PATH_NAME    = path.property( 'value' ) || path.attr( 'placeholder' ) || 'root';
        params.BBOX         = formatBbox( bbox );

        Hoot.api.grailPullOsmToDb( params )
            .then( ( resp ) => Hoot.message.alert( resp ) )
            .then( () => Hoot.folders.refreshDatasets() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) );

        this.form.remove();
    }
}
