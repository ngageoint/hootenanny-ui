/*******************************************************************************************************
 * File: advancedOptsControls.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/16/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export default class AdvancedOptsControls {
    constructor( panel ) {
        this.panel = panel;
        this.data  = panel.data;

        this.transitionTime = 300;
        this.defaultFields  = null;
        this.lastSetFields  = null;
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

                group.selectAll( '.checkplus-input' )
                    .property( 'checked', checked )
                    .each( function() {
                        // toggle children fields
                        d3.select( this.parentNode.parentNode )
                            .selectAll( '.hoot-form-field' )
                            .classed( 'hidden', !checked );
                    } );

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
                    gid         = `#${selectedVal}_engine_group`;

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
                if ( _.includes( [ 'long', 'int', 'double' ], d.type ) ) {
                    // TODO: validate input
                }
            }
        }
    }

    cancel() {
        if ( !_.differenceWith( this.getFields(), this.lastSetFields, _.isEqual ).length ) {
            this.panel.toggle();
            return;
        }

        if ( !window.confirm( 'All options will be reset to previously selected values. Are you sure you want to continue?' ) )
            return;

        setTimeout( () => this.restoreFields(), this.transitionTime );
        this.panel.toggle();
    }

    saveOrCancel() {
        if ( !_.differenceWith( this.getFields(), this.lastSetFields, _.isEqual ).length ) {
            this.panel.toggle();
            return;
        }

        if ( !window.confirm( 'You have unsaved changes. Click OK to save, or cancel to reset to previously selected values.' ) ) {
            setTimeout( () => this.restoreFields(), this.transitionTime );
        } else {
            this.saveFields();
        }

        this.panel.toggle();
    }

    reset() {
        if ( !window.confirm( 'All options will be reset to their default values. Are you sure you want to continue?' ) )
            return;

        this.restoreFields( this.defaultFields );
    }

    getFields() {
        let fields = [];

        this.panel.form.selectAll( 'input' ).each( d => {
            let node = d3.select( '#' + d.id ).node();

            let field = {
                id: node.id,
                type: node.type,
                checked: node.checked,
                value: node.value,
                disabled: node.disabled,
                hidden: d3.select( node.parentNode.parentNode ).classed( 'hidden' )
            };

            fields.push( field );
        } );

        return fields;
    }

    saveFields() {
        this.lastSetFields = this.getFields();
    }

    restoreFields( defaultFields ) {
        let fields = defaultFields ? defaultFields : this.lastSetFields;

        _.forEach( fields, field => {
            let input = d3.select( '#' + field.id ),
                node  = input.node();

            if ( field.type === 'checkbox' ) {
                input.property( 'checked', field.checked );
            } else {
                input.property( 'value', field.value );
            }

            d3.select( node.parentNode.parentNode ).classed( 'hidden', field.hidden );

            input.property( 'disabled', field.disabled );
        } );
    }
}