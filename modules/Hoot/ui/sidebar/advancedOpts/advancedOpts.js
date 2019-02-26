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
                d3.selectAll( '.form-group input' ).property( 'checked', true );
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

    toggleOption(id, checked) {
        let parent = d3.select( `#${id}_group` );
    
        parent.select( '.group-toggle-caret-wrap' )
            .classed( 'toggle-disabled', !checked );

        if (!checked) {
            parent.select( '.group-body' )
                .classed( 'hidden', true );
        }

    }

    createGroups() {
        let toggleOption = this.toggleOption,
            group = this.contentDiv.selectAll( '.form-group' )
                .data( this.advancedOptions );

        group.exit()
            .remove();
            
        let groupEnter = group.enter()
            .append( 'div' )
            .classed( 'form-group', true );

        let groupToggle = groupEnter.append( 'div' )
            .classed( 'group-toggle', true );
        
        let groupHeader = groupToggle.append( 'div' )
            .attr( 'class', 'inner-wrapper strong fill-light keyline-bottom adv-opts-toggle-wrap');

        let groupLeftInnerWrap = groupHeader
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap adv-opts-input', true );

        groupLeftInnerWrap
            .append( 'input' )
            .attr( 'type', 'checkbox' )
            .attr( 'id', d => `${d.id}-toggle` )
            .classed( 'conflate-type-toggle', true )
            .property( 'checked', true )
            .on( 'click', function(d) {
                let checked = d3.select( this ).property( 'checked' );
                toggleOption( d.id, checked ); 
            } );


        groupLeftInnerWrap
            .append( 'div' )
            .append( 'span' )
            .attr( 'id', d => `${ d.id }_label` )
            .classed( 'adv-opt-title', true)
            .text( d => d.label )
            .on( 'click', function(d) { 
                let toggle = d3.select( `#${d.id}-toggle`),
                    checked = toggle.property( 'checked' );

                toggle.property( 'checked', !checked );

                toggleOption( d.id, checked );
            } );

        groupHeader
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap group-toggle-caret-wrap', true );
            // .append( 'div' ) /* IGNORE ADDITIONAL OPTIONS FOR TIME BEING */
            // .attr( 'class', d => `adv-opt-toggle ${ d.members.length ? 'combobox-caret': '' }` )
            // .on( 'click', function(d) {
            //     if (d.members.length) {
            //         let id        = d3.select( this ).datum().id,
            //             body      = d3.select( `#${ id }_group` ).select( '.group-body' ),
            //             bodyState = body.classed( 'hidden' );

            //         body.classed( 'hidden', !bodyState );
            //         body.classed( 'keyline-bottom', bodyState );
            //     }
            // });


        let groupBody = groupEnter.append( 'div' )
            .classed( 'group-body fill-white hidden', true );

        // let fieldContainer = groupBody.selectAll( '.hoot-form-field' ) /* IGNORE ADDITIONAL OPTIONS FOR TIME BEING */
        //     .data(d => d.members);
        
        // fieldContainer.exit()
        //     .remove();

        // let fieldContainerEnter = fieldContainer.enter()
        //     .append( 'div' )
        //     .attr( 'id', d => d.id )
        //     .attr( 'class', d => `hoot-form-field small contain ${d.hidden ? 'hidden': ''}` );

        // fieldContainerEnter.each(function(d) {
        //     let field = d3.select( this );

        //     // add header

        //     if ( d.inputType === 'checkbox' ) {
        //         let datum = field.datum();


        //         let checkboxWrap = field.selectAll( '.form-field-checkbox-wrap')
        //             .data( [ 0 ] );

        //         checkboxWrap.exit()
        //             .remove();
                
        //         let checkboxWrapEnter = checkboxWrap.enter()
        //             .append( 'div' )
        //             .attr( 'class', 'form-field-checkbox-wrap round keyline-all' );

        //         checkboxWrapEnter.append( 'div' )
        //             .attr( 'class', 'form-field-checkbox-title-wrap fill-light keyline-right' )
        //             .append( 'label' )
        //             .attr( 'class', 'adv-opts-header')
        //             .text( datum.label );

        //         checkboxWrapEnter.append( 'div' )
        //             .attr( 'class', 'form-field-checkbox-input-wrap' )
        //             .append( 'input' )
        //             .attr( 'type', 'checkbox' )
        //             .attr( 'id', `${ datum.id }-checkbox-input` )
        //             .classed( 'form-field-checkbox', true );

        //         checkboxWrap.merge(checkboxWrapEnter);
        //     } else {
        //         let fieldHeader = field.selectAll( '.form-field-header' )
        //             .data( [ 0 ] );

        //         fieldHeader.exit()
        //             .remove();

        //         let fieldHeaderEnter = fieldHeader.enter()
        //             .append( 'div' )
        //             .classed( 'form-field-header fill-light round-top keyline-all', true);

        //         fieldHeader
        //             .merge(fieldHeaderEnter)
        //             .append( 'label' )
        //             .append( 'span' )
        //             .attr( 'class', 'adv-opts-header')
        //             .text( d.label );


        //         field.append( 'div' )
        //             .classed( 'form-field-control keyline-left keyline-bottom keyline-right round-bottom', true )
        //             .call((selection) => {
        //                 let datum = selection.datum();
        //                 switch ( datum.inputType ) {
        //                     case 'combobox': {
        //                         let comboData = _map(datum.data, n => {
        //                             const t = datum.itemKey ? n[ datum.itemKey ] : n,
        //                                 v = datum.valueKey ? n[ datum.valueKey ] : t;
        //                             return { value: v, title: t };
        //                         } );
                                
        //                         if ( datum.sort ) {
        //                             comboData = comboData.sort((a, b) => {
        //                                 let textA = a.value.toLowerCase(),
        //                                     textB = b.value.toLowerCase();

        //                                 return textA < textB ? -1 : textA > textB ? 1 : 0;
        //                             } ).unshift( { value: 'root', title: 0 } );
        //                         }

        //                         let combo = selection.selectAll( '.form-field-combo' )
        //                             .data( [ 0 ] );

        //                         combo.exit()
        //                             .remove();

        //                         let comboEnter = combo.enter()
        //                             .append( 'input' )
        //                             .attr( 'class', 'form-field-combo-input' );
        //                             // .attr( 'id', d => `d.id );

        //                         comboEnter
        //                             .attr( 'type', 'text' )
        //                             // .attr( 'id', d => d.id )
        //                             // .attr( 'class', datum.class )
        //                             .attr( 'autocomplete', 'off' )
        //                             .attr( 'placeholder', datum.placeholder )
        //                             .attr( 'value', datum.value )
        //                             .attr( 'disabled', datum.disabled )
        //                             .attr( 'readonly', datum.readonly )
        //                             .call(d3combobox().data(comboData))
        //                             .on( 'change', () => datum.onChange && datum.onChange(datum) )
        //                             .on( 'change.conflation', () => datum.onChange && datum.onChange(datum) );
        //                             // .on( 'keyup', d => d.onChange && d.onChange(d) );

        //                         combo.merge(comboEnter);

        //                         break;
        //                     }
        //                     case 'text': {
        //                         let textField = selection.selectAll( '.form-field-textinput' )
        //                             .data( [ 0 ] );

        //                         textField.exit()
        //                             .remove();

        //                         let textFieldEnter = textField.enter()
        //                             .append( 'input' )
        //                             .attr('class', 'form-field-textinput');
                                    
        //                         textFieldEnter
        //                             .attr( 'type', 'text' )
        //                             .attr( 'placeholder', datum.placeholder )
        //                             .attr( 'value', datum.value )
        //                             .attr( 'readonly', datum.readOnly )
        //                             .attr( 'disabled', datum.disabled )
        //                             .classed( 'text-input', true )
        //                             .on( 'keyup', () => datum.onChange && datum.onChange( datum, this ) );

        //                         textField.merge(textFieldEnter);
                                
        //                         break;
        //                     }
        //                 }
        //             } );
        //     }
        // });

        
        // fieldContainer
        //     .merge( fieldContainerEnter )
        //     .attr( 'id', d => d.id )
        //     .attr( 'class', d => `hoot-form-field small contain ${d.hidden ? 'hidden': ''}` );
        
        group.merge(groupEnter)
            .attr( 'id', d => d.id + '_group');
    }
    
    getOptions() {
        let options = '',
            mergers = [],
            matchers = [],
            isNetwork = d3.select( '#conflateType' ).property( 'value' ) === 'Network';

        // create list of matchers/mergers that are interpretable as the 
        // conflation types the user chose...
        this.contentDiv 
            .selectAll( '.conflate-type-toggle' )
            .each(function(d) {
                let selection = d3.select( this ),
                    checked = selection.property( 'checked' );

                if ( checked ) {
                    let merger, matcher;
                    if ( d.id === 'roadOptions' && isNetwork ) {
                        matcher = d.networkMatcher;
                        merger = d.networkMerger;
                    } else {
                        matcher = d.matcher;
                        merger = d.merger;
                    }

                    mergers.push(merger);
                    matchers.push(matcher);
                }
            } );

        if (mergers.length) {
            if (mergers.length !== matchers.length) {
                Hoot.message.alert( new Error ('Unable to conflate, matchers & mergers are not of equal length') );
                return;
            }
            options += `-D "match.creators=${ matchers.join(';') }" `;
            options += `-D "merger.creators=${ mergers.join(';') }" `;
        }

        
        // add additional advanced options that the user changed...
        // /* these options will be toggle-able in future release...
        // this.contentDiv
        //     .selectAll( '.form-group .hoot-form-field' )
        //     .each( function(d) {
        //         const input = d3.select( this ).select( 'input' );
        //         switch ( d.inputType ) {
        //             case 'checkbox': {
        //                 if (input.property( 'checked' )) {
        //                     let sign = d.hootType === 'list' ? '+=' : '=';
        //                     options += `-D "${ d.key }${ sign }${ d.hootVal ? d.hootVal: 'true' }" `;
        //                 }
        //                 break;
        //             }
        //             case 'text': {
        //                 let value = input.property( 'value' );
                        
        //                 if (!value) break;

        //                 if ( d.extrema ) {
        //                     value = Number(value);
        //                     let [ min, max ] = d.extrema;
        //                     if ( value < min || max < value ) break;
        //                 }

        //                 options += `-D "${ d.key }=${ value }" `;
        //                 break;
        //             }
        //         }
        //     });

        return options.trim();
    }
}
