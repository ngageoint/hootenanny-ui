/*******************************************************************************************************
 * File: conflicts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import API                 from './api';
import ConflictInfo        from './conflicts/conflictInfo';
import ConflictMap         from './conflicts/conflictMap';
import ConflictTraverse    from './conflicts/conflictTraverse';
import ConflictGraphSync   from './conflicts/conflictGraphSync';
import ConflictMerge       from './conflicts/conflictMerge';
import ConflictResolve     from './conflicts/conflictResolve';
import { conflictButtons } from '../config/domElements';
import { d3keybinding }    from '../../lib/d3.keybinding';
import { t }               from '../../util/locale';
import { tooltip }         from '../../util/tooltip';

import {
    getOS,
    tooltipHtml
} from './utilities';

export default class Conflicts {
    constructor( context, contentContainer, layer ) {
        this.context          = context;
        this.contentContainer = contentContainer;

        // data store for all conflict components
        this.data = {
            layer: layer,
            mapId: layer.id,
            reviewStats: null,
            currentReviewItem: null,
            currentRelation: null,
            poiTableCols: null,
            mergedItems: []
        };

        this.buttonEnabled = true;
    }

    deactivate() {
        this.container.remove();
    }

    async init() {
        let modules = await Promise.all( [
            new ConflictInfo( this ),
            new ConflictMap( this ),
            new ConflictTraverse( this ),
            new ConflictGraphSync( this ),
            new ConflictMerge( this ),
            new ConflictResolve( this )
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

    render() {
        this.buttons = conflictButtons.call( this );

        this.createContainer();
        this.createInnerWrapper();
        this.createLeftRightContainers();
        this.createMetaDialog();
        this.createActionButtons();

        this.bindKeys();
    }

    createContainer() {
        this.container = this.contentContainer.append( 'div' )
            .attr( 'id', 'conflicts-container' )
            .classed( 'pin-bottom', true );
    }

    createInnerWrapper() {
        this.innerWrapper = this.container.append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    createLeftRightContainers() {
        this.leftContainer = this.innerWrapper.append( 'div' )
            .classed( 'left-container fillD', true );

        this.rightContainer = this.innerWrapper.append( 'div' )
            .classed( 'right-container', true );
    }

    createMetaDialog() {
        this.metaDialog = this.leftContainer.append( 'div' )
            .classed( 'meta-dialog', true )
            .append( 'span' )
            .classed( '_icon info light', true )
            .html( '<strong class="review-note">Initialzing...</strong>' );
    }

    createActionButtons() {
        let buttons = conflictButtons.call( this );

        this.tooltip = tooltip()
            .placement( 'top' )
            .html( true )
            .title( d => tooltipHtml( t( `review.${ d.id }.description` ), d.cmd ) );

        this.actionButtons = this.leftContainer.append( 'div' )
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
            } )
            .call( this.tooltip );
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