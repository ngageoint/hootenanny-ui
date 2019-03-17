import _map from 'lodash-es/map';

import FormFactory from './formFactory';

import { uuidv4, formatBbox } from './utilities';

export default class DifferentialUpload {
    constructor( instance ) {
        this.instance = instance;
    }

    render() {
        let titleText = this.instance.bboxSelectType === 'visualExtent'
            ? 'Differential Upload from Visual Extent'
            : this.instance.bboxSelectType === 'boundingBox'
                ? 'Differential Upload from Bounding Box'
                : 'Differential Upload';

        let metadata = {
            title: titleText,
            button: {
                text: 'Differential Upload',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'differentialTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = this.form.select( `#${metadata.button.id}` );

        this.submitButton.property( 'disabled', false );

        this.createTable();
    }

    createTable() {
        let that = this;

        let columns = [
            {
                label: 'User ID for Changeset',
                name: 'username'
            },
            {
                label: 'Apply Tag Differential?',
                name: 'applyTags'
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
            .select( function( d ) {
                if ( d.name === 'username' ) {
                    let { display_name } = JSON.parse( localStorage.getItem( 'user' ) );
                    d3.select( this )
                        .attr( 'value', display_name )
                        .attr( 'readonly', true );
                } else if ( d.name === 'applyTags' ) {
                    let parent = d3.select( this.parentElement );

                    parent
                        .selectAll( 'input' )
                        .remove();

                    parent
                        .append( 'input' )
                        .attr( 'type', 'checkbox' )
                        .property( 'checked', false )
                        .attr( 'class', d.name );
                }
            } );
    }

    handleSubmit() {
        const bbox   = this.instance.bbox,
              params = {};

        if ( !bbox ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        let applyTags = this.form.select( '.applyTags' ).property( 'checked' );

        params.APPLY_TAGS = applyTags;
        params.BBOX       = formatBbox( bbox );

        Hoot.api.differentialUpload( params )
            .then( ( resp ) => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
