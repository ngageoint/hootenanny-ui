/*******************************************************************************************************
 * File: advancedOptsLogic.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/16/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export default class AdvancedOptsLogic {
    constructor() {

    }

    handleFieldChange( d ) {
        if ( !d.onchange ) return;

        let fid = `#${ d.id }`,
            checked;

        if ( d.type === 'checkbox' || d.type === 'checkplus' ) {
            checked = d3.select( fid ).property( 'checked' );
        }

        if ( d.id.indexOf( 'enable' ) > -1 ) {
            let gid = fid.replace( 'enable_', '' ) + '_group';

            d3.select( gid ).selectAll( 'input' ).property( 'disabled', !checked );
            d3.select( fid ).property( 'disabled', false );

            if ( d.id === 'hoot_enable_waterway_options' && checked ) {
                let c = d3.select( '#waterway_auto_calc_search_radius' ).property( 'checked' );

                d3.select( '#search_radius_waterway' ).property( 'disabled', c );
                d3.select( '#waterway_rubber_sheet_minimum_ties' ).property( 'disabled', !c );
                d3.select( '#waterway_rubber_sheet_ref' ).property( 'disabled', !c );
            }

            return;
        }

        switch ( d.id ) {
            case 'hoot_checkall_cleaning_options': {
                let group = d3.select( '#hoot_cleaning_options_group' );

                group.selectAll( '.checkbox-input:not([id*=enable])' ).property( 'checked', checked );
                group.selectAll( '.checkplus-input' ).property( 'checked', checked );

                break;
            }
            case 'duplicate_way_remover': {
                d3.selectAll( '.duplicate_way_remover_child' ).classed( 'hidden', !checked );
                break;
            }
            case 'small_way_merger': {
                d3.selectAll( '.small_way_merger_child' ).classed( 'hidden', !checked );
                break;
            }
            case 'hoot_road_opt_engine': {
                let selectedVal = d3.select( fid ).node().value,
                    gid = `#${selectedVal}_engine_group`;

                d3.selectAll( '.hoot_road_opt_engine_group' ).classed( 'hidden', true );
                d3.select( gid ).classed( 'hidden', false );
                break;
            }
            case 'waterway_auto_calc_search_radius': {
                d3.select( '#search_radius_waterway' ).property( 'disabled', checked );
                d3.select( '#waterway_rubber_sheet_minimum_ties' ).property( 'disabled', !checked );
                d3.select( '#waterway_rubber_sheet_ref' ).property( 'disabled', !checked );
                break;
            }
            default: {
                if ( _.includes( [ 'long', 'int', 'double' ], d.type )  ) {
                    // TODO: validate input
                }
            }
        }
    }
}