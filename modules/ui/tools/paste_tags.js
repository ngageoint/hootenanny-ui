/*******************************************************************************************************
 * File: paste_tags.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/13/18
 *******************************************************************************************************/

import _forEach from 'lodash-es/forEach';
import _omit    from 'lodash-es/omit';

import { utilKeybinding }   from '../../util/keybinding';
import { t }                from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { tooltipHtml }      from '../../Hoot/tools/utilities';
import { svgIcon }          from '../../svg';
import { modeSelect }       from '../../modes';
import { actionChangeTags } from '../../actions';
import { uiCmd }            from '../cmd';

export function uiPasteTags( context ) {
    let commands = [ {
        id: 'overwrite',
        icon: 'iD-icon-paste-tags-overwrite',
        cmd: uiCmd( '⌘⇧V' ),
        action: () => doPasteTags( true ),
        annotation: () => 'Overwrite Tags'
    }, {
        id: 'append',
        icon: 'iD-icon-paste-tags-append',
        cmd: uiCmd( '⌘⌥V' ),
        action: () => doPasteTags( false ),
        annotation: () => 'Append Tags'
    } ];

    function hasCopy() {
        return context.copyIDs().length || Object.keys( context.copyTags() ).length;
    }

    function omitTag( v, k ) {
        return (
            k.indexOf( 'hoot' ) === 0 ||
            k === 'error:circular' ||
            k === 'source:datetime' ||
            k === 'source:ingest:datetime' ||
            k === 'uuid'
        );
    }

    function doPasteTags( d3_event, overwrite ) {
        d3_event.preventDefault();

        let copyTags    = context.copyTags(),
            oldIDs      = context.copyIDs(),
            oldGraph    = context.copyGraph(),
            selectedIDs = context.selectedIDs();

        if ( !copyTags && !oldIDs.length ) return;

        _forEach( selectedIDs, eid => {
            let selectEntity = oldGraph.entity( eid );

            if ( Object.keys( copyTags ).length > 0 ) { //use copied tags
                selectEntity = selectEntity.mergeTags( _omit( copyTags, omitTag ), d3_event.shiftKey || overwrite );
            } else { //use copied features
                for ( let i = 0; i < oldIDs.length; i++ ) {
                    let oldEntity = oldGraph.entity( oldIDs[ i ] );

                    selectEntity = selectEntity.mergeTags( _omit( oldEntity.tags, omitTag ), d3_event.shiftKey || overwrite );
                }
            }

            context.perform( actionChangeTags( selectEntity.id, selectEntity.tags ),
                t( 'operations.change_tags.annotation' ) );
        } );

        context.enter( modeSelect( context, selectedIDs ) );
    }

    return function( selection ) {
        let buttonTooltip = uiTooltip()
            .placement( 'bottom' )
            .title((d3_event, d) => selection => {
                selection.html(tooltipHtml( t( d.id + '.tooltip' ), d.cmd ))
            });

        let buttons = selection.selectAll( 'button' )
            .data( commands )
            .enter().append( 'button' )
            .attr( 'class', 'col6 disabled' )
            .on( 'click', (d3_event, d) => d.action() )
            .call( buttonTooltip );

        buttons.each( function( d ) {
            d3.select( this ).call( svgIcon( `#${ d.icon }` ) );
        } );

        let keybinding = utilKeybinding( 'paste_tags' )
            .on( commands[ 0 ].cmd, function(d3_event) {
                d3_event.preventDefault();
                commands[ 0 ].action();
            } )
            .on( commands[ 1 ].cmd, function(d3_event) {
                d3_event.preventDefault();
                commands[ 1 ].action();
            } );

        d3.select( document )
            .call( keybinding );

        context
            .on( 'enter.paste_tags', update );

        function update( mode ) {
            //Disable paste tags if there are no features or tags copied
            //or if there is no feature(s) selected
            let disabled = !hasCopy() || !((mode.id === 'select') && mode.selectedIDs().length);

            buttons
                .property( 'disabled', disabled )
                .classed( 'disabled', disabled )
                .each( () => {
                    let selection = d3.select( this );

                    if ( selection.property( 'tooltipVisible' ) ) {
                        selection.call( tooltip.show );
                    }
                } );
        }
    };
}
