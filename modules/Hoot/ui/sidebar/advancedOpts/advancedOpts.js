/*******************************************************************************************************
 * File: advancedOpts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/23/18
 *******************************************************************************************************/

import _                    from 'lodash-es';
import Hoot                 from '../../../hoot';
import AdvancedOptsData     from './advancedOptsData';
import AdvancedOptsControls from './advancedOptsControls';
import { d3combobox }       from '../../../../lib/hoot/d3.combobox';

export default class AdvancedOpts {
    constructor() {
        this.sidebar         = d3.select( '#hoot-sidebar' );
        this.optTypes        = [ 'custom', 'horizontal', 'average', 'reference' ];
        this.advancedOptions = null;
    }

    get isOpen() {
        return this.form.classed( 'visible' );
    }

    async init() {
        this.optTypes = [ 'custom', 'horizontal', 'average', 'reference' ];
        let allOpts   = await Promise.all( _.map( this.optTypes, type => Hoot.api.getAdvancedOptions( type ) ) );

        this.advancedOptions = {
            base: allOpts[ 0 ],
            horizontal: allOpts[ 1 ],
            average: allOpts[ 2 ],
            reference: allOpts[ 3 ]
        };

        this.data    = new AdvancedOptsData( this, _.cloneDeep( this.advancedOptions ) );
        this.control = new AdvancedOptsControls( this );

        this.render();
    }

    render() {
        this.fieldsMeta = this.data.getDefaultMeta();

        this.createContainer();
        this.createHeader();
        this.createContentDiv();
        this.createGroups();
        this.createButtons();

        this.control.saveFields();

        this.control.defaultFields = this.control.lastSetFields;
    }

    toggle() {
        let formState = this.form.classed( 'visible' );

        this.form.classed( 'visible', !formState );
        this.overlay.classed( 'visible', !formState );
        d3.select( '#sidebar-resizer' ).classed( 'light', !formState );
    }

    createContainer() {
        this.form = this.sidebar.append( 'div' )
            .attr( 'id', 'advanced-opts-panel' )
            .classed( 'fill-white', true )
            .style( 'margin-left', () => this.sidebar.node().getBoundingClientRect().width = 'px' );

        this.overlay = d3.select( '#content' ).append( 'div' )
            .classed( 'map-overlay overlay', true );
    }

    createHeader() {
        let header = this.form.append( 'div' )
            .classed( 'advanced-opts-header big keyline-bottom flex justify-between align-center', true );

        header.append( 'h3' )
            .text( 'Advanced Conflation Options' );

        // reset button
        header.append( 'div' )
            .append( 'button' )
            .classed( 'advanced-opts-reset button secondary strong', true )
            .text( 'Reset' )
            .on( 'click', () => this.control.reset() );
    }

    createContentDiv() {
        this.contentDiv = this.form.append( 'div' )
            .classed( 'advanced-opts-content', true );
    }

    createGroups() {
        let instance = this;

        let group = this.contentDiv.selectAll( '.form-group' )
            .data( this.fieldsMeta ).enter()
            .append( 'div' )
            .attr( 'id', d => d.id + '_group' )
            .classed( 'form-group', true );

        let groupToggle = group.append( 'div' )
            .classed( 'group-toggle', true )
            .on( 'click', function() {
                let parent    = d3.select( this ).node().parentNode,
                    body      = d3.select( parent ).select( '.group-body' ),
                    bodyState = body.classed( 'hidden' );

                body.classed( 'hidden', !bodyState );
            } );

        groupToggle.append( 'div' )
            .classed( 'inner-wrapper strong fill-light keyline-top keyline-bottom', true )
            .append( 'span' )
            .attr( 'id', d => `${ d.id }_label` )
            .text( d => d.label );

        let groupBody = group.append( 'div' )
            .classed( 'group-body fill-white hidden', true );

        groupBody.select( function( d ) {
            if ( d.children && d.children.length ) {
                instance.createFormFields( d.children, d3.select( this ) );
            }
        } );
    }

    createFormFields( members, group ) {
        let instance = this;

        let fieldContainer = group.selectAll( '.hoot-form-field' )
            .data( members ).enter()
            .append( 'div' )
            .classed( 'hoot-form-field small contain', true )
            .classed( 'hidden', d => d.required === 'true' )
            .on( 'change', d => this.control.handleFieldChange( d ) );

        fieldContainer
            .append( 'label' )
            .append( 'span' )
            .text( d => d.label );

        fieldContainer.select( function( d ) {
            let field = d3.select( this );

            switch ( d.type ) {
                case 'checkbox': {
                    instance.createCheckbox( field );
                    break;
                }
                case 'checkplus': {
                    instance.createCheckplus( field );
                    break;
                }
                case 'bool':
                case 'list': {
                    instance.createCombobox( field );
                    break;
                }
                case 'long':
                case 'int':
                case 'double':
                case 'string': {
                    instance.createTextField( field );
                    break;
                }
            }
        } );
    }

    createCheckbox( field ) {
        field.select( 'label' )
            .insert( 'input', ':first-child' )
            .attr( 'type', 'checkbox' )
            .attr( 'id', d => d.id )
            .classed( 'reset', true )
            .classed( 'checkbox-input', d => d.type === 'checkbox' )
            .classed( 'checkplus-input', d => d.type === 'checkplus' )
            .select( function( d ) {
                this.checked = d.placeholder === 'true';
            } );
    }

    createCheckplus( field ) {
        let instance = this;

        this.createCheckbox( field );

        field.select( function( d ) {
            if ( d.subchecks && d.subchecks.length ) {
                d3.select( this ).classed( 'has-children', true );
                instance.createFormFields( d.subchecks, field );

                field.selectAll( '.hoot-form-field' ).classed( d.id + '_child', true );
            }
        } );
    }

    createTextField( field ) {
        field.select( 'label' )
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', d => d.id )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'min', d => d.minvalue > 0 ? d.minvalue : 'na' )
            .attr( 'max', d => d.maxvalue > 0 ? d.maxvalue : 'na' )
            .on( 'input', d => this.control.handleFieldInput( d ) );
    }

    createCombobox( field ) {
        let instance = this;

        field.select( 'label' )
            .append( 'input' )
            .attr( 'id', d => d.id )
            .attr( 'type', 'text' )
            .attr( 'placeholder', d => d.placeholder )
            .select( function( d ) {
                if ( d.combobox ) {
                    let combobox = d3combobox()
                        .data( _.map( d.combobox, n => {
                            return {
                                value: n.name,
                                title: n.name,
                                id: n.id
                            };
                        } ) );

                    d3.select( this )
                        .attr( 'readonly', true )
                        .call( combobox );

                    instance.createSubGroup( field, d );
                }
            } );
    }

    createSubGroup( field, d ) {
        let instance  = this,
            fieldData = this.data.getFieldMeta( d.combobox );

        field.selectAll( '.form-group' )
            .data( fieldData )
            .enter()
            .append( 'div' )
            .attr( 'id', s => s.label + '_engine_group' )
            .classed( `form-group contain ${d.id}_group`, true )
            .classed( 'hidden', s => s.label !== d.placeholder )
            .select( function( s ) {
                if ( s.children && s.children.length ) {
                    field.classed( 'has-children', true );

                    instance.createFormFields( s.children, d3.select( this ) );
                }
            } );
    }

    createButtons() {
        let actionsContainer = this.form.append( 'div' )
            .classed( 'advanced-opts-actions keyline-top', true );

        actionsContainer.append( 'button' )
            .classed( 'button primary round strong', true )
            .text( 'Apply' )
            .on( 'click', () => {
                let saved = this.control.saveFields();

                if ( saved ) {
                    this.toggle();
                }
            } );

        actionsContainer.append( 'button' )
            .classed( 'button alert round strong', true )
            .text( 'Cancel' )
            .on( 'click', () => this.control.cancel() );
    }
}