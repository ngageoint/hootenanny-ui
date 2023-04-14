/*******************************************************************************************************
 * File: schema_switcher.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 9/5/18
 *******************************************************************************************************/

import _map                        from 'lodash-es/map';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import { utilRebind } from '../util';
import { d3combobox } from '../Hoot/ui/d3.combobox';

export function uiSchemaSwitcher() {
    let dispatch = d3_dispatch( 'change' );

    function schemaSwitcher( selection, callback ) {
        let switcher = selection.classed( 'tag-schema', true );

        switcher
            .append( 'label' )
            .text( 'Tag Schema:' );

        let input = switcher.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'value', Hoot.translations.activeTranslation )
            .on( 'change', function() {
                Hoot.translations.setActiveTranslation( this.value );

                if ( callback && typeof callback === 'function' ) {
                    callback();
                }
            } );

        let combobox = d3combobox()
            .data( _map( Hoot.translations.availableTranslations, n => {
                return {
                    value: n,
                    title: n
                };
            } ) );

        input.call( combobox );
    }

    return utilRebind( schemaSwitcher, dispatch, 'on' );
}
