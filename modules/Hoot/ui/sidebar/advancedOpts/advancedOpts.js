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
        let self = this;

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
            .on( 'click', () => { 
                self.advancedOptions = advancedOptions(self); 
                self.createGroups();
            });
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
        let group = this.contentDiv.selectAll( '.form-group' )
            .data( this.advancedOptions );

        group.exit()
            .remove();
            
        let groupEnter = group.enter()
            .append( 'div' )
            .classed( 'form-group', true );
        let groupToggle = groupEnter.append( 'div' )
            .classed( 'group-toggle', true );
            // .on( 'click', function() {
            //     let parent    = d3.select( this ).node().parentNode,
            //         body      = d3.select( parent ).select( '.group-body' ),
            //         bodyState = body.classed( 'hidden' );

            //     body.classed( 'hidden', !bodyState );
            // } );

        
        let groupHeader = groupToggle.append( 'div' )
            .attr( 'class', (d) => {
                return `inner-wrapper strong fill-light keyline-bottom adv-opts-toggle ${ d.id === 'buildingOptions' ? 'keyline-top' : '' }`;
            });


        // let conflateToggle = groupHeader
        //     .append( 'div' )
        //     .classed( 'adv-opts-toggle-member conflate-type-toggle-wrap', true );

        let groupLeftInnerWrap = groupHeader
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap adv-opts-input', true )

        groupLeftInnerWrap
            .append( 'input' )
            .attr( 'type', 'checkbox' )
            .attr( 'id', d => `${d.id}-toggle` )
            .classed( 'conflate-type-toggle', true )
            .property( 'checked', true )
            .on( 'click', function(d) {
                let selection = d3.select( this ),
                    checked = selection.property( 'checked' ),
                    parent = d3.select( selection.node().parentNode.parentNode );
                
                parent.select( '.group-toggle-caret-wrap span' )
                    .classed( 'toggle-disabled', !checked );
            } );
        
        groupLeftInnerWrap
            .append( 'div' )
            .append( 'span' )
            .attr( 'id', d => `${ d.id }_label` )
            .classed( 'adv-opt-title', true)
            .text( d => d.label );

        // groupHeader
        //     .append( 'div' )
        //     .classed( 'adv-opts-inner-wrap group-toggle-caret-wrap', true )
        //     .append( 'div' )
        //     .classed( 'adv-opt-toggle combobox-caret', true )
        //     .on( 'click', function() {            
        //         let id        = d3.select( this ).datum().id,
        //             body      = d3.select( `#${ id }_group` ).select( '.group-body' ),
        //             bodyState = body.classed( 'hidden' );

        //         body.classed( 'hidden', !bodyState );
        //     });


        let groupBody = groupEnter.append( 'div' )
            .classed( 'group-body fill-white hidden', true );

        let fieldContainer = groupBody.selectAll( '.hoot-form-field' )
            .data(d => d.members);
        
        fieldContainer.exit()
            .remove();

        let fieldContainerEnter = fieldContainer.enter()
            .append( 'div' )
            .attr( 'id', d => d.id )
            .attr( 'class', d => `hoot-form-field small contain ${d.hidden ? 'hidden': ''}` );

        fieldContainerEnter.each(function(d) {
            let field = d3.select( this );

            // add header

            let fieldHeader = field.selectAll( '.form-field-header' )
                .data( [ 0 ] );

            fieldHeader.exit()
                .remove();

            let fieldHeaderEnter = fieldHeader.enter()
                .append( 'div' )
                .classed( 'form-field-header keyline-bottom', true);

            fieldHeader
                .merge(fieldHeaderEnter)
                .append( 'label' )
                .append( 'span' )
                .text( d.label );


            field.append( 'div' )
                .classed( '.form-field-control', true )
                .call((selection) => {
                    let datum = selection.datum();
                    switch ( datum.inputType ) {
                        case 'combobox': {
                            let comboData = _map(datum.data, n => {
                                const t = datum.itemKey ? n[ datum.itemKey ] : n,
                                    v = datum.valueKey ? n[ datum.valueKey ] : t;
                                return { value: v, title: t };
                            } );
                            
                            if ( datum.sort ) {
                                comboData = comboData.sort((a, b) => {
                                    let textA = a.value.toLowerCase(),
                                        textB = b.value.toLowerCase();

                                    return textA < textB ? -1 : textA > textB ? 1 : 0;
                                } ).unshift( { value: 'root', title: 0 } );
                            }

                            let combo = selection.selectAll( '.form-field-combo' )
                                .data( [ 0 ] );

                            combo.exit()
                                .remove();

                            let comboEnter = combo.enter()
                                .append( 'input' )
                                .attr( 'class', 'form-field-combo-input' );
                                // .attr( 'id', d => `d.id );

                            comboEnter
                                .attr( 'type', 'text' )
                                // .attr( 'id', d => d.id )
                                // .attr( 'class', datum.class )
                                .attr( 'autocomplete', 'off' )
                                .attr( 'placeholder', datum.placeholder )
                                .attr( 'value', datum.value )
                                .attr( 'disabled', datum.disabled )
                                .attr( 'readonly', datum.readonly )
                                .call(d3combobox().data(comboData))
                                .on( 'change', () => datum.onChange && datum.onChange(datum) )
                                .on( 'change.conflation', () => datum.onChange && datum.onChange(datum) );
                                // .on( 'keyup', d => d.onChange && d.onChange(d) );

                            combo.merge(comboEnter);

                            break;
                        }
                        case 'checkbox': {
                            let checkbox = selection.selectAll( '.form-field-checkbox' )
                                .data( [ 0 ] );

                            checkbox.exit()
                                .remove();

                            let checkboxEnter = checkbox = checkbox.enter()
                                .append( 'input' )
                                .attr( 'id', `${datum.id}-checkbox-input` )
                                .attr( 'class', '' );
                                
                            checkboxEnter
                                .attr( 'type', 'checkbox' )
                                .property( 'checked', datum.checked );

                            checkbox
                                .append( 'label' )
                                .attr( 'for', `${datum.id}-checkbox-input`) 
                                .text( datum.value );

                            checkbox.merge(checkboxEnter);

                            break;
                        }
                        case 'text': {
                            let textField = selection.selectAll( '.form-field-textinput' )
                                .data( [ 0 ] );

                            textField.exit()
                                .remove();

                            let textFieldEnter = textField.enter()
                                .append( 'input' )
                                .attr('class', 'form-field-textinput');
                                
                            textFieldEnter
                                .attr( 'type', 'text' )
                                .attr( 'placeholder', datum.placeholder )
                                .attr( 'value', datum.value )
                                .attr( 'readonly', datum.readOnly )
                                .attr( 'disabled', datum.disabled )
                                .classed( 'text-input', true )
                                .on( 'keyup', () => datum.onChange && datum.onChange( datum, this ) );

                            textField.merge(textFieldEnter);
                            
                            break;
                        }
                    }
                } );
        });

        
        fieldContainer
            .merge( fieldContainerEnter )
            .attr( 'id', d => d.id )
            .attr( 'class', d => `hoot-form-field small contain ${d.hidden ? 'hidden': ''}` );
        
        group.merge(groupEnter)
            .attr( 'id', d => d.id + '_group');
    }
    
    getOptions() {
        let options = '',
            mergers = [],
            matchers = [];

        this.contentDiv
            .selectAll( '.conflate-type-toggle' )
            .each(function(d) {
                let selection = d3.select( this ),
                    checked = selection.property( 'checked' );

                if ( checked ) {
                    mergers.push(d.merger);
                    matchers.push(d.matcher);
                    // options += `-D "match.creators-=${ d.matcher }"`;
                    // options += `-D "merger.creators-=${ d.merger }"`;
                }
            } );

        if (mergers.length && (mergers.length === matchers.length)) {
            options += `-D "match.creators=${ matchers.join(';') }" `;
            options += `-D "merger.creators=${ mergers.join(';') }" `;
        }

            // .selectAll( '.form-group .hoot-form-field' )
            // .each( function(d) {
            //     const input = d3.select( this ).select( 'input' );
            //     switch ( d.inputType ) {
            //         case 'checkbox': {
            //             if (input.property( 'checked' )) {
            //                 let sign = d.hootType === 'list' ? '+=' : '=';
            //                 options += `-D "${ d.key }${ sign }${ d.hootVal ? d.hootVal: 'true' }" `;
            //             }
            //             break;
            //         }
            //         case 'text': {
            //             let value = input.property( 'value' );
                        
            //             if (!value) break;

            //             if (d.extrema) {
            //                 value = Number(value);
            //                 let [ min, max ] = d.extrema;
            //                 if ( value < min || max < value ) break;
            //             }

            //             options += `-D "${ d.key }=${ value }" `;
            //             break;
            //         }
            //     }

            //     if ( d.matchersMergers && d.changed ) {
            //         let value = input.property( 'value' ).toLowerCase();
            //         let [ matcher, merger ] = d.matchersMergers[value];
            //         options += `-D "match.creators+=${ matcher }" `;
            //         options += `-D "merger.creators+=${ merger }" `;
            //     }

            // });

        return options.trim();
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
