/*******************************************************************************************************
 * File: conflicts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _                   from 'lodash-es';
import API                 from '../../managers/api';
import ConflictInfo        from './conflictsInfo';
import ConflictsMap        from './conflictsMap';
import ConflictsTraverse   from './conflictsTraverse';
import ConflictsGraphSync  from './conflictsGraphSync';
import ConflictsMerge      from './conflictsMerge';
import ConflictsResolve    from './conflictsResolve';
import { conflictButtons } from '../../config/domMetadata';
import { d3keybinding }    from '../../../lib/d3.keybinding';
import { t }               from '../../../util/locale';
import { tooltip }         from '../../../util/tooltip';

import {
    getOS,
    tooltipHtml
} from '../../tools/utilities';

/**
 * @class Conflicts
 */
export default class Conflicts {
    /**
     * @param context - iD context
     * @param contentContainer - div to render conflicts UI in
     * @param layer - merged layer
     */
    constructor( context, contentContainer, layer ) {
        this.context          = context;
        this.contentContainer = contentContainer;

        // data store for all conflicts components
        this.data = {
            layer: layer,
            mapId: layer.id,
            reviewStats: null,
            currentReviewItem: null,
            currentRelation: null,
            currentFeatures: null,
            mergedItems: []
        };

        this.buttonEnabled = true;
    }

    /**
     * Deactivate conflicts review
     */
    deactivate() {
        this.context.map().on( 'drawn', null );
        this.map.unsetHighlight();
        this.container.remove();
    }

    /**
     * Initialize conflicts review and all of its submodules
     */
    async init() {
        let modules = await Promise.all( [
            new ConflictInfo( this ),
            new ConflictsMap( this ),
            new ConflictsTraverse( this ),
            new ConflictsGraphSync( this ),
            new ConflictsMerge( this ),
            new ConflictsResolve( this )
        ] );

        this.info      = modules[ 0 ];
        this.map       = modules[ 1 ];
        this.traverse  = modules[ 2 ];
        this.graphSync = modules[ 3 ];
        this.merge     = modules[ 4 ];
        this.resolve   = modules[ 5 ];

        let reviewStats = await API.getReviewStatistics( this.data.mapId );

        if ( reviewStats.totalCount === 0 ) return;

        this.render();

        this.context.map().on( 'drawn', () => {
            this.map.setHighlight();
        } );

        this.traverse.jumpTo( 'forward' );
    }

    /**
     * Render conflicts review UI
     */
    render() {
        this.buttonData = conflictButtons.call( this );

        this.container = this.contentContainer.append( 'div' )
            .attr( 'id', 'conflicts-container' )
            .classed( 'pin-bottom', true );

        this.innerWrapper = this.container.append( 'div' )
            .classed( 'inner-wrapper', true );

        this.leftContainer = this.innerWrapper.append( 'div' )
            .classed( 'left-container fillD', true );

        this.rightContainer = this.innerWrapper.append( 'div' )
            .classed( 'right-container', true );

        this.metaDialog = this.leftContainer.append( 'div' )
            .classed( 'meta-dialog', true )
            .append( 'span' )
            .classed( '_icon info light', true )
            .html( '<strong class="review-note">Initialzing...</strong>' );

        this.tooltip = tooltip()
            .placement( 'top' )
            .html( true )
            .title( d => tooltipHtml( t( `review.${ d.id }.description` ), d.cmd ) );

        this.actionButtons = this.leftContainer.append( 'div' )
            .classed( 'action-buttons', true )
            .selectAll( 'button' )
            .data( this.buttonData ).enter()
            .append( 'button' )
            .attr( 'class', d => d.class )
            .text( d => d.text )
            .on( 'click', d => {
                setTimeout( () => this.buttonEnabled = true, 500 );

                if ( this.buttonEnabled ) {
                    this.buttonEnabled = false;
                    d.action();
                }
            } )
            .call( this.tooltip );

        this.bindKeys();
    }

    /**
     * Bind key press events to actions buttons
     */
    bindKeys() {
        let keybinding = d3keybinding( 'conflicts' );

        _.forEach( this.buttonData, bt => {
            keybinding.on( bt.cmd, () => {
                d3.event.preventDefault();
                bt.action();
            } );
        } );

        d3.select( document )
            .call( keybinding );
    }

    /**
     * Get key code based on current OS
     *
     * @param code
     * @returns {string} - key code
     */
    cmd( code ) {
        if ( getOS() === 'mac' ) {
            return code;
        }

        if ( getOS() === 'win' ) {
            if ( code === '⌘⇧Z' ) return 'Ctrl+Y';
        }

        let replacements = {
                '⌘': 'Ctrl',
                '⇧': 'Shift',
                '⌥': 'Alt',
                '⌫': 'Backspace',
                '⌦': 'Delete'
            },
            result       = '';

        for ( let i = 0; i < code.length; i++ ) {
            if ( code[ i ] in replacements ) {
                result += replacements[ code[ i ] ] + '+';
            } else {
                result += code[ i ];
            }
        }

        return result;
    }
}