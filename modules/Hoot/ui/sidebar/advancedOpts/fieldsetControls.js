/*******************************************************************************************************
 * File: fieldsetControls.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/16/18
 *******************************************************************************************************/

import _           from 'lodash-es';
import Hoot        from '../../../hoot';
import { isNaN }   from '../../../tools/utilities';
import { tooltip } from '../../../../util/tooltip';

export default class FieldsetControls {
    constructor( panel ) {
        this.panel = panel;
        this.data  = panel.data;

        this.transitionTime = 300;

        this.defaultFields = null;
        this.lastSetFields = null;
        this.formValid     = true;
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
                break;
            }
        }
    }

    handleFieldInput( d ) {
        if ( _.includes( [ 'long', 'int', 'double' ], d.type ) ) {
            this.validateField( d );
        }
    }

    validateField( d ) {
        let target      = d3.select( '#' + d.id ),
            parent      = d3.select( target.node().parentNode ),
            val         = target.property( 'value' ),
            min         = target.property( 'min' ),
            max         = target.property( 'max' ),
            valid       = true,
            invalidText = '';

        if ( isNaN( val ) ) {
            valid       = false;
            invalidText = 'Value must be a valid number';
        }

        if ( !isNaN( min ) && val < min ) {
            valid       = false;
            invalidText = `Value must be greater than ${ min }`;
        }

        if ( !isNaN( max ) && val > max ) {
            valid       = false;
            invalidText = `Value must be less than ${ max }`;
        }

        if ( d.id === 'poipolygon_review_distance_threshold' || d.id === 'poipolygon_match_distance_threshold' ) {
            let reviewElem = d3.select( '#poipolygon_review_distance_threshold' ),
                matchElem  = d3.select( '#poipolygon_match_distance_threshold' ),
                reviewVal  = parseFloat( reviewElem.property( 'value' ) ) || reviewElem.attr( 'placeholder' ),
                matchVal   = parseFloat( matchElem.property( 'value' ) || matchElem.attr( 'placeholder' ) );

            if ( reviewVal <= matchVal ) {
                valid       = false;
                invalidText = 'POI Polygon Review Distance Threshold must be greater than the POI Polygon Match Distance Threshold.';
            }
        }

        let textTooltip = tooltip()
            .placement( 'top' )
            .html( 'true' )
            .title( invalidText );

        target.classed( 'invalid', !valid );

        if ( !valid ) {
            parent.call( textTooltip );
            textTooltip.show( parent );
        } else {
            textTooltip.destroy( parent );
        }
    }

    async cancel() {
        if ( !_.differenceWith( this.getFields(), this.lastSetFields, _.isEqual ).length ) {
            this.panel.toggle();
            return;
        }

        let message = 'All options will be reset to previously selected values. Are you sure you want to continue?',
            confirm = await Hoot.message.confirm( message );

        if ( confirm ) {
            setTimeout( () => this.restoreFields(), this.transitionTime );
            this.panel.toggle();
        }
    }

    async saveOrCancel() {
        if ( !_.differenceWith( this.getFields(), this.lastSetFields, _.isEqual ).length ) {
            this.panel.toggle();
            return;
        }

        let message = 'You have unsaved changes. Click <strong>OK to save</strong>, or <strong>cancel to reset</strong> options to previously selected values.',
            confirm = await Hoot.message.confirm( message );

        if ( !confirm ) {
            setTimeout( () => this.restoreFields(), this.transitionTime );
        } else {
            this.saveFields();
        }

        this.panel.toggle();
    }

    async reset() {
        let message = 'All options will be reset to their default values. Are you sure you want to continue?',
            confirm = await Hoot.message.confirm( message );

        if ( confirm ) {
            this.restoreFields( this.defaultFields );
        }
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
        if ( this.panel.form.selectAll( 'input.invalid' ).size() > 0 ) {
            alert( 'Please fix invalid fields before continuing.' );
            return false;
        } else {
            this.lastSetFields = this.getFields();
            return true;
        }
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