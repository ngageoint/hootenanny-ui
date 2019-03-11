/*******************************************************************************************************
 * File: advancedOpts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/23/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _map       from 'lodash-es/map';

import { d3combobox }   from '../../../../lib/hoot/d3.combobox';
import FormFactory from '../../../tools/formFactory';

let instance = null;
export default class AdvancedOpts {
    constructor() {
        this.sidebar         = d3.select( '#hoot-sidebar' );
        this.advancedOptions = [];
    }

    static getInstance() {
        if (instance === null) {
            instance = new AdvancedOpts();
        }
        return instance;
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
    
    async init() {
        if (!this.advancedOptions.length) {
            this.advancedOptions = await Hoot.api.getAdvancedOptions();
        }
        if ( !this.rendered() ) {
            this.render();
        } else {
            // this.reset();
            this.createGroups();
        }
    }

    reset() {
        this.contentDiv
            .selectAll( '.conflate-type-toggle' )
            .property( 'checked', true );

        this.contentDiv
            .selectAll( '.adv-opt-title' )
            .classed( 'adv-opt-title-disabled', false );
            
        this.contentDiv
            .selectAll( '.group-toggle-caret-wrap' )
            .classed( 'toggle-disabled', false );


        this.contentDiv.selectAll( '.hoot-form-field' ).each(function(d) {
            if (d.send) delete d.send;
            let input = d3.select( this ).select( 'input' );
            input.property( 'value', d.defualt );
        });

    }

    rendered() {
        return !d3.select( '#advanced-opts-panel' ).empty();
    }

    render() {
        this.createContainer();
        this.createHeader();
        this.createContentDiv();
        this.createGroups();
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
            .on( 'click', () => { 
                d3.selectAll( '.form-group input' )
                    .property( 'checked', true );
                
                d3.selectAll( '.form-group .adv-opt-title')
                    .classed( 'adv-opt-title-disabled', false);
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

    toggleOption(d, shouldHide) {
        let label = d3.select( `#${d.name}_label` ),
            parent = d3.select( `#${d.name}_group` );

        parent
            .select( '.group-toggle-caret-wrap' )
            .classed( 'toggle-disabled', shouldHide );
                
        label
            .classed( 'adv-opt-title-disabled', !label.classed( 'adv-opt-title-disabled' ) );

        if (shouldHide) {
            parent.select( '.group-body' )
                .classed( 'hidden', true );
        }
    }

    shouldSend(d) {
        d.send = d3.select( this ).property( 'value' ) !== d.default;
    }

    setType(d) {
        return d.type === 'check' 
            ? 'checkbox'
            : 'text';
    }

    createGroups() {
        let toggleOption = this.toggleOption,
            shouldSend = this.shouldSend,
            setType = this.setType,
            group = d3.select( '.advanced-opts-content' )
                .selectAll( '.form-group' )
                .data( _cloneDeep( this.advancedOptions ) );

        group.exit()
            .remove();
            
        let groupEnter = group.enter()
            .append( 'div' )
            .classed( 'form-group', true )
            .attr( 'id', d => d.name + '_group');


        let groupToggle = groupEnter
            .append( 'div' )
            .classed( 'group-toggle', true );
            
        let groupHeader = groupToggle.append( 'div' )
            .attr( 'class', 'inner-wrapper strong fill-light keyline-bottom adv-opts-toggle-wrap');

        groupHeader
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap adv-opts-input', true );

        // above, do once
        group = group.merge(groupEnter);

        // below, update each time...

        let groupLeftInnerWrap = group.selectAll( '.adv-opts-inner-wrap .adv-opts-input' )
            .data([ d ]);

        groupLeftInnerWrap.exit()
            .remove();

        let groupLeftInnerWrapEnter = groupLeftInnerWrap.enter()
            .append( 'input' )
            .attr( 'type', 'checkbox' )
            .attr( 'id', d => `${d.name}-toggle` )
            .classed( 'conflate-type-toggle', true )
            .property( 'checked', true )
            .on( 'click', d => toggleOption(d) );


        groupLeftInnerWrapEnter
            .append( 'div' )
            .on('click', d => {
                let toggle = d3.select( `#${d.name}-toggle`),
                    checked = toggle.property( 'checked' );
                    
                toggle.property( 'checked', !checked );

                toggleOption( d, checked ); 
            } )
            .append( 'span' )
            .attr( 'id', d => `${ d.name }_label` )
            .classed( 'adv-opt-title', true )
            .text( d => `${d.label} Options` );

        groupLeftInnerWrap = groupLeftInnerWrap.merge(groupLeftInnerWrapEnter);

        // groupHeader
        //     .append( 'div' )
        //     .classed( 'adv-opts-inner-wrap group-toggle-caret-wrap', true )
        //     .append( 'div' )
        //     .attr( 'class', d => `adv-opt-toggle ${ d.members.length ? 'combobox-caret': '' }` )
        //     .on( 'click', function(d) {
        //         if (d.members.length) {
        //             let name      = d3.select( this ).datum().name,
        //                 body      = d3.select( `#${ name }_group` ).select( '.group-body' ),
        //                 bodyState = body.classed( 'hidden' );

        //             body.classed( 'hidden', !bodyState );
        //             body.classed( 'keyline-bottom', bodyState );
        //         }
        //     });


            
        // groupEnter.append( 'div' )
        //     .classed( 'group-body fill-white hidden', true );
            
        // let fieldContainer = groupEnter.selectAll( '.group-body' )
        //     .selectAll( '.hoot-form-field' )
        //     .data(d => d.members);
        
        // fieldContainer.exit()
        //     .remove();

        // let fieldContainerEnter = fieldContainer.enter()
        //     .append( 'div' )
        //     .attr( 'id', d => d.id )
        //     .attr( 'class', d => `hoot-form-field small contain ${d.hidden ? 'hidden': ''}` );


        // fieldContainerEnter
        //     .append( 'div' )
        //     .append( 'label' )
        //     .text( d => d.label );

        // fieldContainerEnter
        //     .append( 'input' )
        //     .attr( 'type', setType )
        //     .property( 'value', d => d.default );


        // fieldContainer = fieldContainer.merge( fieldContainerEnter );
        group = group.merge(groupEnter);
        
        // fieldContainerEnter.each(function(d) {
        //     let field = d3.select( this );
        //     // add header
        //     if ( d.input === 'check' ) {

        //         // let checkboxWrap = field.selectAll( '.form-field-checkbox-wrap' )
        //         //     .data( [ 0 ] );

        //         // checkboxWrap.exit()
        //         //     .remove();
                
        //         // let checkboxWrapEnter = checkboxWrap.enter()
        //         //     .append( 'div' )
        //         //     .attr( 'class', 'form-field-checkbox-wrap round keyline-all' );

        //         // checkboxWrapEnter.append( 'div' )
        //         //     .attr( 'class', 'form-field-checkbox-title-wrap fill-light keyline-right' )
        //         //     .append( 'label' )
        //         //     .attr( 'class', 'adv-opts-header')
        //         //     .text( d.label );

        //         // checkboxWrapEnter.append( 'div' )
        //         //     .attr( 'class', 'form-field-checkbox-input-wrap' )
        //         //     .append( 'input' )
        //         //     .attr( 'type', 'checkbox' )
        //         //     .attr( 'id', `${ d.id }-checkbox-input` )
        //         //     .classed( 'form-field-checkbox', true );

        //         // checkboxWrap = checkboxWrap.merge(checkboxWrapEnter);
        //     } else {
        //         let fieldHeader = field.selectAll( '.form-field-header' )
        //             .data( [ 0 ] );

        //         fieldHeader.exit()
        //             .remove();

        //         let fieldHeaderEnter = fieldHeader.enter()
        //             .append( 'div' )
        //             .classed( 'form-field-header fill-light round-top keyline-all', true);


        //         fieldHeaderEnter
        //             .append( 'label' )
        //             .append( 'span' )
        //             .attr( 'class', 'adv-opts-header')
        //             .text( d.label );

        //         fieldHeader = fieldHeader.merge(fieldHeaderEnter);

        //         field.append( 'div' )
        //             .classed( 'form-field-control keyline-left keyline-bottom keyline-right round-bottom', true )
        //             .call((selection) => {
        //                 switch ( d.input ) {
        //                     case 'combo': {
        //                         let comboData = _map(d.data, n => {
        //                             const t = d.itemKey ? n[ d.itemKey ] : n,
        //                                 v = d.valueKey ? n[ d.valueKey ] : t;
        //                             return { value: v, title: t };
        //                         } );
                                
        //                         if ( d.sort ) {
        //                             comboData = comboData.sort((a, b) => {
        //                                 let textA = a.value.toLowerCase(),
        //                                     textB = b.value.toLowerCase();

        //                                 return textA < textB ? -1 : textA > textB ? 1 : 0;
        //                             } );
                                    
        //                             if ( d.class === 'path-name' ) {
        //                                 comboData = [ { value: 'root', title: 0 } ].concat(comboData);
        //                             }
        //                         }

        //                         let combo = selection.selectAll( '.form-field-combo' )
        //                             .data( [ d ] );

        //                         combo.exit()
        //                             .remove();

        //                         let comboEnter = combo.enter()
        //                             .append( 'input' )
        //                             .attr( 'class', 'form-field-combo-input' )
        //                             .attr( 'id', d => `${d.id}-combo-input`)
        //                             .property( 'value', d => d.default );


        //                         comboEnter
        //                             .attr( 'type', 'text' )
        //                             .attr( 'autocomplete', 'off' )
        //                             .attr( 'placeholder', d => d.placeholder )
        //                             .attr( 'disabled', d => d.disabled )
        //                             .attr( 'readonly', d => d.readonly )
        //                             .call(d3combobox().data(comboData))
        //                             .on( 'change', shouldSend );
                                
        //                         combo = combo.merge(comboEnter);
        //                         break;
        //                     }
        //                     // case 'text': {
        //                     //     let textField = selection.selectAll( '.form-field-textinput' )
        //                     //         .data( [ d ] );

        //                     //     textField.exit()
        //                     //         .remove();

        //                     //     let textFieldEnter = textField.enter()
        //                     //         .append( 'input' )
        //                     //         .attr('class', 'form-field-textinput');
                                    
        //                     //     textFieldEnter
        //                     //         .attr( 'type', 'text' )
        //                     //         .attr( 'placeholder', d => d.placeholder )
        //                     //         .attr( 'value', d => d.value )
        //                     //         .attr( 'readonly', d => d.readOnly )
        //                     //         .attr( 'disabled', d => d.disabled )
        //                     //         .classed( 'text-input', true )
        //                     //         .on( 'keyup', shouldSend);

        //                     //     textField = textField.merge(textFieldEnter);
        //                     //     break;
        //                     // }
        //                 }
        //             } );
        //     }
        // });
        
        //     .attr( 'id', d => d.id )
        //     .attr( 'class', d => `hoot-form-field small contain ${d.hidden ? 'hidden': ''}` );
    }

    /**
     * Returns list of all conflation types with unchecked (disabled) checkboxes...
     */
    getDisabledFeatures() {
        let disabledFeatures = [];
        this.contentDiv
            .selectAll( '.conflate-type-toggle' )
            .each(function(d) {
                let selection = d3.select( this );
                
                if ( !selection.property( 'checked' ) ) {
                    disabledFeatures.push(selection.datum().label.replace(/ to /, ''))
                }
            } );

        return disabledFeatures;
    }

    getOptions() {
        let options = {};
        this.contentDiv.selectAll( '.form-group .hoot-form-field' ).each( function(d) {
            const selection = d3.select( this ).select( 'input' );

            if ( !selection.empty() ) {
                switch ( d.input ) {
                    case 'check': {
                        if ( selection.property( 'checked' ) ) {
                            options[ d.id ] = true;
                        }
                        break;
                    }
                    case 'combo': {
                        if ( !d.send ) break;
                        
                        let value = selection.property( 'value' );
                        if ( value ) {
                            options[ d.id ] = value;
                        }
                        break;
                    }
                    case 'text': {
                        if ( !d.send ) break;

                        let value = selection.property( 'value' );
                        if ( !value ) break;
                        if ( d.extrema ) {
                            value = Number(value);
                            if ( isNaN( value ) ) break;
                            let [ min, max ] = d.extrema;
                            if ( value < min || max < value ) break;
                        }

                        options[ d.id ] = value;
                        break;
                    }
                }
            }
        });

        return options;
    }
}