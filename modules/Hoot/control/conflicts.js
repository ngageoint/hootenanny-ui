/*******************************************************************************************************
 * File: conflicts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import ConflictInfo        from './conflicts/conflictInfo';
import ConflictMap         from './conflicts/conflictMap';
import ConflictTraverse    from './conflicts/conflictTraverse';
import ConflictGraphSync   from './conflicts/conflictGraphSync';
import { conflictButtons } from '../config/domElements';
import API                 from './api';

export default class Conflicts {
    constructor( context, contentContainer, layer ) {
        this.context          = context;
        this.contentContainer = contentContainer;

        this.data = {
            layer: layer,
            mapId: layer.id,
            poiTableCols: [],
            reviewStats: null,
            curReviewItem: null,
            curEntityId: null,
            curEntity: null
        };

        this.info      = new ConflictInfo( this );
        this.map       = new ConflictMap( this );
        this.traverse  = new ConflictTraverse( this );
        this.graphSync = new ConflictGraphSync( this );
    }

    async init() {
        this.render();
        this.listen();

        this.reviewStats = await API.getReviewStatistics( this.data.mapId );

        this.traverse.jumpTo( 'forward' );
    }

    render() {
        this.createContainer();
        this.createReviewBlock();
        this.createMetaDialog();
        this.createActionButtons();
        this.createPoiTable();
    }

    createContainer() {
        this.container = this.contentContainer.append( 'div' )
            .attr( 'id', 'conflicts-container' )
            .classed( 'pin-bottom unclickable', true );
    }

    createReviewBlock() {
        this.reviewBlock = this.container.append( 'div' )
            .classed( 'review-block fillD', true );
    }

    createMetaDialog() {
        this.metaDialog = this.reviewBlock.append( 'div' )
            .classed( 'meta-dialog', true )
            .append( 'span' )
            .classed( '_icon info dark', true )
            .html( '<strong class="review-note">Initialzing...</strong>' );
    }

    createActionButtons() {
        let buttons = conflictButtons.call( this );

        this.actionButtons = this.reviewBlock.append( 'div' )
            .classed( 'action-buttons', true )
            .selectAll( 'button' )
            .data( buttons ).enter()
            .append( 'button' )
            .text( d => d.text );
    }

    createPoiTable() {
        this.poiTable = this.container
            .insert( 'div', ':first-child' )
            .classed( 'tag-table block', true )
            .append( 'table' )
            .classed( 'round keyline-all', true );
    }

    listen() {
        //Event.listen( 'meta-updated' );
    }
}