/*******************************************************************************************************
 * File: advancedOptsLogic.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/16/18
 *******************************************************************************************************/


export default class AdvancedOptsLogic {
    constructor() {

    }

    handleFieldChange( d ) {
        let fid = `#${ d.id }`,
            checked;

        if ( d.type === 'checkbox' || d.type === 'checkplus' ) {
            checked = d3.select( fid ).property( 'checked' );
        }

        if ( d.id.indexOf( 'enable' ) > -1 ) {
            let gid = fid.replace( 'enable_', '' ) + '_group';

            d3.select( gid ).selectAll( 'input' ).property( 'disabled', !checked );
            d3.select( fid ).property( 'disabled', false );

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

            }
        }
    }

    /**
     * Handler for fields that have the "onchange" property set to true
     */
    fieldChangeEvent() {

    }
}