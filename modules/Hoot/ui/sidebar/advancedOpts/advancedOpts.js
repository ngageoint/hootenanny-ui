/*******************************************************************************************************
 * File: advancedOpts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/23/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _map       from 'lodash-es/map';

import FieldsetData     from './fieldsetData';
import FieldsetControls from './fieldsetControls';
import { advancedOptions } from '../../../config/domMetadata';
import { d3combobox }   from '../../../../lib/hoot/d3.combobox';
import FormFactory from '../../../tools/formFactory';


export default class AdvancedOpts {
    constructor() {
        let self = this;
        this.sidebar         = d3.select( '#hoot-sidebar' );
        this.advancedOptions = advancedOptions(this);
        Hoot.events.on( 'advancedOptions-changed', (updatedOpt) => {
            for (let i = 0; i < self.advancedOptions; i++) { // update advanced options..
                if (self.advancedOptions[i].id === updatedOpt.id) {
                   self.advancedOptions[i] = updatedOpt; 
                }
            }
            self.createGroups(); // re-render...
        });
    }

    getFactory() {
        if (!this.hasOwnProperty( 'factory' )) {
            this.factory = new FormFactory();
        }
        return this.factory;
    }


    get isOpen() {
        return this.form.classed( 'visible' );
    }
    
    init() {
        this.render();
    }

    render() {
        this.createContainer();
        this.createHeader();
        this.createContentDiv();
        this.createGroups();
        // this.createButtons();
    }

    reRender() {
        this.createContentDiv();
        this.createGroups();
    }

    clear() {
        d3.selectAll( '.advanced-opts-content' ).remove();
        this.reRender();
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
        let header = this.form
            .append( 'div' )
            .classed( 'advanced-opts-header big keyline-bottom flex justify-between align-center', true );

        header
            .append( 'div' )
            .classed( 'title', true )
            .text( 'Advanced Conflation Options' );

        // reset button
        header
            .append( 'div' )
            .append( 'button' )
            .classed( 'advanced-opts-reset button secondary strong', true )
            .text( 'Reset' )
            .on( 'click', () => this.control.reset() );
    }

    createContentDiv() {
        this.contentDiv = this.form
            .append( 'div' )
            .classed( 'advanced-opts-content', true )
            .style( 'opacity', 0 );

        this.contentDiv
            .transition()
            .duration( 400 )
            .style( 'opacity', 1 );
    }

    createGroups() {
        let self = this;

        let group = this.contentDiv.selectAll( '.form-group' )
            .data( this.advancedOptions );

        group.exit()
            .remove();
            
        group = group.enter()
            .append( 'div' )
            .merge(group)
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

        let fieldContainer = groupBody.selectAll( '.hoot-form-field' )
            .data(d => d.members);
        
        fieldContainer.exit()
            .remove();

        fieldContainer = fieldContainer.enter()
            .append( 'div' )
            .merge( fieldContainer )
            .attr( 'id', d => d.id)
            .classed( 'hoot-form-field small contain', true )
            .classed( 'hidden', d => d.hidden );

        fieldContainer.each(d => {
            let selection = d3.select( `#${d.id}` );

            // add header

            let fieldHeader = selection.selectAll( '.form-field-header' )
                .data( [ d ] );

            fieldHeader.exit()
                .remove();

            fieldHeader = fieldHeader.enter()
                .append( 'div' )
                .merge(fieldHeader)
                .classed( 'form-field-header keyline-bottom', true)
                .append( 'label' )
                .append( 'span' )
                .text( d => d.label );


            selection.append( 'div' )
                .classed( '.form-field.control', true )
                .call(d => {
                    let data = d.data()[0];
                    switch ( data.inputType ) {
                        case 'combobox': {
                            let comboData = _map(data.data, n => {
                                const t = data.itemKey ? n[ data.itemKey ] : n,
                                    v = data.valueKey ? n[ data.valueKey ] : t;
                                return { value: v, title: t };
                            } );
                            
                            if (comboData.sort) {
                                comboData = comboData.sort((a, b) => {
                                    let textA = a.value.toLowerCase(),
                                        textB = b.value.toLowerCase();

                                    return textA < textB ? -1 : textA > textB ? 1 : 0;
                                } ).unshift( { value: 'root', title: 0 } );
                            }

                            let combo = selection.selectAll( `#${data.id}` )
                                .data( [ data ] );

                            combo.exit()
                                .remove();

                            combo = combo.enter()
                                .append('input')
                                .merge(combo)
                                .attr( 'type', 'text' )
                                .attr( 'id', d => d.id )
                                .attr( 'class', d => d.class )
                                .attr( 'autocomplete', 'off' )
                                .attr( 'placeholder', d => d.placeholder )
                                .attr( 'value', d => d.value )
                                .attr( 'disabled', d => d.disabled )
                                .attr( 'readonly', d => d.readonly )
                                .call(d3combobox().data(comboData))
                                .on( 'change', d => d.onChange && d.onChange(d) )
                                .on( 'keyup', d => d.onChange && d.onChange(d) );

                            break;
                        }
                        case 'checkbox': {
                            let checkbox = selection.selectAll( `#${data.id}` )
                                .data( [ data ] );

                            checkbox.exit()
                                .remove();

                            checkbox = checkbox.enter()
                                .append( 'input' )
                                .merge( checkbox )
                                .attr( 'type', 'checkbox' )
                                .attr( 'id', d => d.id )
                                .attr( 'class', d => d.class )
                                .property( 'checked', d => d.checked );

                            checkbox
                                .append( 'label' )
                                .attr( 'for', d => d.id) 
                                .text( d => d.value );

                            break;
                        }
                        case 'text': {
                            let textField = selection.selectAll( `#${data.id}` )
                                .data( [ data ] );

                            textField.exit()
                                .remove();

                            textField = textField.enter()
                                .append( 'input' )
                                .merge( textField )
                                .attr( 'type', 'text' )
                                .attr( 'id', d => d.id )
                                .attr( 'class', d => d.class )
                                .attr( 'placeholder', d => d.placeholder )
                                .attr( 'value', d => d.value )
                                .attr( 'readonly', d => d.readOnly )
                                .attr( 'disabled', d => d.disabled )
                                .classed( 'text-input', true )
                                .on( 'keyup', function( d ) {
                                    if ( d.onChange ) {
                                        d.onChange( d, this );
                                    }
                                } );
                            break;
                        }
                    }
                } );
        });
    }
    
    getOptions() {
        let options = '';
        this.contentDiv.selectAll( '.form-group .hoot-form-field' )
            .each( d => {
                const field = this.contentDiv.select( `#${d.id}` );
                switch ( d.inputType ) {
                    case 'checkbox': {
                        if (field.property('checked')) {
                            options += `-D "${d.key}=${d.hootVal ? d.hootVal : 'true'}" `;
                        }
                        break;
                    }
                    // case 'slider': {
                    //     if ()
                    // 
                }
            });

        return options;
    }

        // createCheckbox( field ) {
        //     field.select( 'label' )
        //         .insert( 'input', ':first-child' )
        //         .attr( 'type', 'checkbox' )
        //         .attr( 'id', d => d.id )
        //         .classed( 'reset', true )
        //         .classed( 'checkbox-input', d => d.type === 'checkbox' )
        //         .classed( 'checkplus-input', d => d.type === 'checkplus' )
        //         .select( function( d ) {
        //             this.checked = d.placeholder === 'true';
        //         } );
        // }

        // createCheckplus( field ) {
        //     let instance = this;

        //     this.createCheckbox( field );

        //     field.select( function( d ) {
        //         if ( d.subchecks && d.subchecks.length ) {
        //             d3.select( this ).classed( 'has-children', true );
        //             instance.createFormFields( d.subchecks, field );

        //             field.selectAll( '.hoot-form-field' ).classed( d.id + '_child', true );
        //         }
        //     } );
        // }

        // createTextField( field ) {
        //     field.select( 'label' )
        //         .append( 'input' )
        //         .attr( 'type', 'text' )
        //         .attr( 'id', d => d.id )
        //         .attr( 'placeholder', d => d.placeholder )
        //         .attr( 'min', d => d.minvalue > 0 ? d.minvalue : 'na' )
        //         .attr( 'max', d => d.maxvalue > 0 ? d.maxvalue : 'na' )
        //         .on( 'input', d => this.control.handleFieldInput( d ) );
        // }

        // createCombobox( field ) {
        //     let instance = this;

        //     field.select( 'label' )
        //         .append( 'input' )
        //         .attr( 'id', d => d.id )
        //         .attr( 'type', 'text' )
        //         .attr( 'placeholder', d => d.placeholder )
        //         .select( function( d ) {
        //             if ( d.combobox ) {
        //                 let combobox = d3combobox()
        //                     .data( _map( d.combobox, n => {
        //                         return {
        //                             value: n.name,
        //                             title: n.name,
        //                             id: n.id
        //                         };
        //                     } ) );

        //                 d3.select( this )
        //                     .attr( 'readonly', true )
        //                     .call( combobox );

        //                 instance.createSubGroup( field, d );
        //             }
        //         } );
        // }

        // createSubGroup( field, d ) {
        //     let instance  = this,
        //         fieldData = this.data.getFieldMeta( d.combobox );

        //     field.selectAll( '.form-group' )
        //         .data( fieldData )
        //         .enter()
        //         .append( 'div' )
        //         .attr( 'id', s => s.label + '_engine_group' )
        //         .classed( `form-group contain ${d.id}_group`, true )
        //         .classed( 'hidden', s => s.label !== d.placeholder )
        //         .select( function( s ) {
        //             if ( s.children && s.children.length ) {
        //                 field.classed( 'has-children', true );

        //                 instance.createFormFields( s.children, d3.select( this ) );
        //             }
        //         } );
        // }

        // createButtons() {
        //     let actionsContainer = this.form.append( 'div' )
        //         .classed( 'advanced-opts-actions keyline-top', true );

        //     actionsContainer.append( 'button' )
        //         .classed( 'button primary round strong', true )
        //         .text( 'Apply' )
        //         .on( 'click', () => {
        //             let saved = this.control.saveFields();

        //             if ( saved ) {
        //                 this.toggle();
        //             }
        //         } );

        //     actionsContainer.append( 'button' )
        //         .classed( 'button alert round strong', true )
        //         .text( 'Cancel' )
        //         .on( 'click', () => this.control.cancel() );
    // }
}
