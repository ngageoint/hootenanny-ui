/*******************************************************************************************************
 * File: sidebarAdvancedOptions.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/23/18
 *******************************************************************************************************/

import _               from 'lodash-es';
import API             from '../../control/api';
import FieldsRetriever from '../models/advancedOptions/fieldsRetriever';

export default class SidebarAdvancedOptions {
    constructor( context ) {
        this.context         = context;
        this.body            = context.container();
        this.sidebar         = d3.select( '#sidebar' );
        this.optTypes        = [ 'custom', 'horizontal', 'average', 'reference' ];
        this.advancedOptions = null;
    }

    async init() {
        let allOpts = await Promise.all( _.map( this.optTypes, type => API.getAdvancedOptions( type ) ) );

        this.advancedOptions = {
            base: allOpts[ 0 ],
            horizontal: allOpts[ 1 ],
            average: allOpts[ 2 ],
            reference: allOpts[ 3 ]
        };

        this.fieldsRetriever = new FieldsRetriever( _.cloneDeep( this.advancedOptions ) );

        this.render();
    }

    render() {
        let fieldsMeta = this.fieldsRetriever.getDefaultFields();

        this.createContainer();
        //this.createForm();
        this.createHeader();
        this.createContentDiv();
        this.createGroups( fieldsMeta );
        this.createButtons();
    }

    toggle() {
        let containerState = this.container.classed( 'visible' );

        this.container.classed( 'visible', !containerState );
        this.overlay.classed( 'visible', !containerState );
        d3.select( '#sidebar-resizer' ).classed( 'light', !containerState );
    }

    createContainer() {
        this.container = this.sidebar.append( 'div' )
            .attr( 'id', 'advanced-opts-panel' )
            .classed( 'fill-white', true )
            .style( 'margin-left', () => this.sidebar.node().getBoundingClientRect().width = 'px' );

        this.overlay = d3.select( '#content' ).append( 'div' )
            .classed( 'map-overlay overlay', true );
    }

    createHeader() {
        this.container.append( 'div' )
            .classed( 'advanced-opts-header big keyline-bottom', true )
            .append( 'h3' )
            .text( 'Advanced Conflation Options' )
            .append( 'div' )
            .classed( 'fr _icon close pointer', true );
    }

    createContentDiv() {
        this.contentDiv = this.container.append( 'div' )
            .classed( 'advanced-opts-content', true );
    }

    createGroups( fieldsMeta ) {
        this.group = this.contentDiv.selectAll( '.form-group' )
            .data( fieldsMeta ).enter()
            .append( 'div' )
            .classed( 'form-group', true );


        this.group.append( 'div' )
            .classed( 'group-toggle', true )
            .append( 'div' )
            .classed( 'inner-wrapper strong fill-light keyline-top keyline-bottom', true )
            .append( 'span' )
            .attr( 'id', d => `${ d.id }_label` )
            .text( d => d.label )
            .on( 'click', () => {} );

        this.groupBody = this.group.append( 'div' )
            .classed( 'group-body fill-white', true );

        this.groupBody.select( d => {
            if ( d.children && d.children.length ) {
                this.createFormFields( d.children );
            }
        } );
    }

    createFormFields( children ) {
        this.groupBody.selectAll( '.form-field' )
            .data( children ).enter()
            .append( 'div' )
            .classed( 'form-field contain small', true )
            .select( d => {
                //switch( d.type ) {
                //    case: 'check'
                //}
            } );
    }

    createButtons() {
        this.container.append( 'div' )
            .classed( 'advanced-opts-actions keyline-top', true );
    }
}