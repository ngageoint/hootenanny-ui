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
        this.createInnerWrapper();
        this.createForm();
    }

    toggle() {
        let containerState = this.container.classed( 'visible' );

        this.container.classed( 'visible', !containerState );
        this.overlay.classed( 'visible', !containerState );
    }

    createContainer() {
        this.container = this.sidebar.append( 'div' )
            .attr( 'id', 'advanced-opts-form' )
            .style( 'margin-left', () => this.sidebar.node().getBoundingClientRect().width = 'px' );

        this.overlay = d3.select( '#content' ).append( 'div' )
            .classed( 'map-overlay overlay', true );
    }

    createInnerWrapper() {
        this.wrapper = this.container.append( 'div' )
            .classed( 'wrapper', true );
    }

    createForm() {

    }

    createButtons() {

    }
}