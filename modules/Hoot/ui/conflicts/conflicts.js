/*******************************************************************************************************
 * File: conflicts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/

import _forEach from 'lodash-es/forEach';

import Info                from './info';
import Map                 from './map';
import Traverse            from './traverse';
import GraphSync           from './graphSync';
import Merge               from './merge';
import Resolve             from './resolve';
import { conflictActions } from '../../config/domMetadata';
import { utilKeybinding }  from '../../../util/keybinding';
import { t }               from '../../../core/localizer';
import { tooltip }         from '../../../util/tooltip';

import {
    getOS,
    tooltipHtml
} from '../../tools/utilities';


const privateMethods = {
    initData() {
        return {
            layer: null,
            mapId: null,
            reviewStats: null,
            currentReviewItem: null,
            currentRelation: null,
            currentFeatures: null,
            mergedItems: [],
            mergedConflicts: []
        };
    }
};

/**
 * @class Conflicts
 */
export default class Conflicts {
    /**
     * @param contentContainer - div to render conflicts UI in
     */
    constructor( contentContainer ) {
        this.contentContainer = contentContainer;

        // data store for all conflicts components
        this.data = privateMethods.initData();

        this.buttonEnabled = true;
    }

    /**
     * Deactivate conflicts review
     */
    deactivate() {
        Hoot.context.map().on( 'drawn', null );
        this.map.unsetHighlight();
        this.container.remove();
        this.data = privateMethods.initData();
    }

    /**
     * Initialize conflicts review and all of its submodules
     */
    async init( layer ) {
        this.data.layer = layer;
        this.data.mapId = layer.id;

        let modules = await Promise.all( [
            new Info( this ),
            new Map( this ),
            new Traverse( this ),
            new GraphSync( this ),
            new Merge( this ),
            new Resolve( this )
        ] );

        this.info      = modules[ 0 ];
        this.map       = modules[ 1 ];
        this.traverse  = modules[ 2 ];
        this.graphSync = modules[ 3 ];
        this.merge     = modules[ 4 ];
        this.resolve   = modules[ 5 ];

        this.render();

        Hoot.context.map().on( 'drawn', () => this.map.setHighlight() );

        this.traverse.showFirstReview( layer );
    }

    /**
     * Render conflicts review UI
     */
    render() {
        this.buttonMeta = conflictActions.call( this );

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
            .html( '<strong class="review-note">Initializing...</strong>' );

        this.tooltip = tooltip()
            .placement( 'top' )
            .html( true )
            .title( (d3_event, d) => tooltipHtml( t( `review.${ d.id }.description` ), d.cmd ) );

        // create buttons
        this.leftContainer.append( 'div' )
            .classed( 'action-buttons', true )
            .selectAll( 'button' )
            .data( this.buttonMeta ).enter()
            .append( 'button' )
            .attr( 'class', d => d.class )
            .text( d => d.text )
            .on( 'click', (d3_event, d) => {
                setTimeout( () => this.buttonEnabled = true, 500 );

                if ( this.buttonEnabled ) {
                    this.buttonEnabled = false;
                    d.action(d3_event);
                }
            } )
            .call( this.tooltip );

        this.bindKeys();
    }

    /**
     * Bind key press events to actions buttons
     */
    bindKeys() {
        let keybinding = utilKeybinding( 'conflicts' );

        _forEach( this.buttonMeta, bt => {
            keybinding.on( bt.cmd, (d3_event) => {
                d3_event.preventDefault();

                if ( Hoot.context.selectedIDs().length > 0 ) {
                    return;
                }
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
