/*******************************************************************************************************
 * File: conflicts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import ConflictInfo        from './conflicts/conflictInfo';
import ConflictMap         from './conflicts/conflictMap';
import ConflictTraverse    from './conflicts/conflictTraverse';
import ConflictGraphSync   from './conflicts/conflictGraphSync';
import ConflictMerge       from './conflicts/conflictMerge';
import { conflictButtons } from '../config/domElements';
import { d3keybinding }    from '../../lib/d3.keybinding';
import { getOS }           from './utilities';
import API                 from './api';

export default class Conflicts {
    constructor( context, contentContainer, layer ) {
        this.context          = context;
        this.contentContainer = contentContainer;

        this.data = {
            layer: layer,
            mapId: layer.id,
            reviewStats: null,
            currentReviewItem: null,
            currentRelation: null
        };

        this.buttonEnabled = true;

        this.info      = new ConflictInfo( this );
        this.map       = new ConflictMap( this );
        this.traverse  = new ConflictTraverse( this );
        this.graphSync = new ConflictGraphSync( this );
        this.merge     = new ConflictMerge( this );
    }

    async init() {
        this.render();

        this.data.reviewStats = await API.getReviewStatistics( this.data.mapId );

        this.traverse.jumpTo( 'forward' );
    }

    render() {
        this.buttons = conflictButtons.call( this );

        this.createContainer();
        this.createReviewBlock();
        this.createMetaDialog();
        this.createActionButtons();

        this.bindKeys();
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
            .attr( 'class', d => d.class )
            .text( d => d.text )
            .on( 'click', d => {
                setTimeout( () => this.buttonEnabled = true, 500 );

                if ( this.buttonEnabled ) {
                    this.buttonEnabled = false;
                    d.action();
                }
            } );
    }

    bindKeys() {
        let bt = this.buttons;

        let keybinding = d3keybinding( 'conflicts' )
            .on( bt[ 0 ].cmd, () => {
                d3.event.preventDefault();
                this.callHotkeyAction( bt[ 0 ] );
            } )
            .on( bt[ 1 ].cmd, () => {
                d3.event.preventDefault();
                this.callHotkeyAction( bt[ 1 ] );
            } )
            .on( bt[ 2 ].cmd, () => {
                d3.event.preventDefault();
                this.callHotkeyAction( bt[ 2 ] );
            } )
            .on( bt[ 3 ].cmd, () => {
                d3.event.preventDefault();
                this.callHotkeyAction( bt[ 3 ] );
            } )
            .on( bt[ 4 ].cmd, () => {
                d3.event.preventDefault();
                this.callHotkeyAction( bt[ 4 ] );
            } )
            .on( bt[ 5 ].cmd, () => {
                d3.event.preventDefault();
                this.callHotkeyAction( bt[ 5 ] );
            } );

        d3.select( document )
            .call( keybinding );
    }

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

    callHotkeyAction( button ) {
        button.action();
    }
}