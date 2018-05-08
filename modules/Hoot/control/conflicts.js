/*******************************************************************************************************
 * File: conflicts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

//import _                   from 'lodash-es';
//import Event               from '../managers/eventManager';
import ConflictMetadata    from './conflicts/conflictMetadata';
import ConflictMap         from './conflicts/conflictMap';
import ConflictTraverse    from './conflicts/conflictTraverse';
import ConflictGraphSync   from './conflicts/conflictGraphSync';
import { conflictButtons } from '../config/domElements';

export default class Conflicts {
    constructor( context, contentContainer, layer ) {
        this.context          = context;
        this.contentContainer = contentContainer;

        this.layer            = layer;
        this.mapId            = layer.id;

        this.metadata  = new ConflictMetadata( this );
        this.map       = new ConflictMap( this );
        this.traverse  = new ConflictTraverse( this );
        this.graphSync = new ConflictGraphSync( this );
    }

    async init() {
        this.render();
        this.listen();

        this.metadata.init()
            .then( () => this.traverse.jumpTo( 'forward' ) );

        //Promise.all( [
        //    this.metadata.init(),
        //    this.map.init()
        //] ).then( () => this.render() );
    }

    render() {
        this.createContainer();
        this.createMetaDialog();
        this.createActionButtons();
    }

    createContainer() {
        this.container = this.contentContainer.append( 'div' )
            .attr( 'id', 'conflicts-container' )
            .classed( 'pin-bottom review-block unclickable fillD', true );
    }

    createMetaDialog() {
        this.metaDialog = this.container.append( 'div' )
            .classed( 'meta-dialog', true )
            .append( 'span' )
            .classed( '_icon info dark', true )
            .html( '<strong class="review-note">Initialzing...</strong>' );
    }

    createActionButtons() {
        let buttons = conflictButtons.call( this );

        this.actionButtons = this.container.append( 'div' )
            .classed( 'action-buttons', true )
            .selectAll( 'button' )
            .data( buttons ).enter()
            .append( 'button' )
            .text( d => d.text );
    }

    updateMetaDialog() {
        //this.metaDialog
    }

    listen() {
        //Event.listen( 'meta-updated' );
    }
}