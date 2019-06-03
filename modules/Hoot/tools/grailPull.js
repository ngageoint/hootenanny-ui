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
            ? 'Pull Remote Data to Visual Extent'
            : this.instance.bboxSelectType === 'boundingBox'
                ? 'Pull Remote Data to Bounding Box'
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
            mapEditData = this.form.select( '.mapeditName' );

        params.BBOX     = formatBbox( bbox );

        Promise.all([
                Hoot.api.grailPullOverpassToDb( params ),
                Hoot.api.grailPullRailsPortToDb( params )
            ])
            .then( ( resp ) => {
                resp.forEach( jobResp => {
                    Hoot.message.alert( jobResp );
                });
            } )
            .then( () => Hoot.folders.refreshAll() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) );

        this.form.remove();
    }
}
