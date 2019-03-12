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

    innerWrap(toggleInput, toggleOption) {
        let d = toggleInput.datum(),
            innerWrap = toggleInput.selectAll( '.adv-opts-inner-wrap' )
                .data([ 0 ]);

        innerWrap.exit().remove();

        let innerWrapEnter = innerWrap.enter()
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap adv-opts-input' , true);

        innerWrap = innerWrap.merge(innerWrapEnter);

        let innerInput = innerWrap.selectAll( '.conflate-type-toggle' )
            .data( [ d ] );

        innerInput.exit().remove();

        let innerInputEnter = innerInput.enter()
            .append( 'input' )
            .attr( 'type', 'checkbox' )
            .attr( 'id', d => `${d.name}-toggle` )
            .classed( 'conflate-type-toggle', true );


        innerInput.merge(innerInputEnter)
            .property( 'checked', true )
            .on( 'click', toggleOption );

        let innerLabelWrap = innerWrap.selectAll( '.adv-opt-title-wrap' )
            .data( [ d ] );
        
        innerLabelWrap.exit().remove();

        let innerLabelWrapEnter = innerLabelWrap.enter()
            .append( 'div' )
            .classed( 'adv-opt-title-wrap', true );
            

        innerLabelWrap = innerLabelWrap.merge(innerLabelWrapEnter)
        
        innerLabelWrap
            .on('click', d => {
                let toggle = d3.select( `#${d.name}-toggle`),
                    checked = toggle.property( 'checked' );
                        
                toggle.property( 'checked', !checked );

                toggleOption( d, checked ); 
            } );

        let innerLabel = innerLabelWrap.selectAll( '.adv-opt-title' )
            .data([ d ]);

        innerLabel.exit().remove();

        let innerLabelEnter = innerLabel.enter()
            .append( 'span' )
            .classed( 'adv-opt-title', true );

        innerLabel.merge(innerLabelEnter)
            .attr( 'id', d => `${ d.name }_label` )
            .classed( 'adv-opt-title-disabled', false )
            .text( d => `${d.label} Options` );
    }

    caretWrap(toggleInput) {
        let d = toggleInput.datum(),
            caretWrap = toggleInput
                .selectAll( '.group-toggle-caret-wrap' )
                .data( [ d ] );

        caretWrap.exit().remove();

        let caretWrapEnter = caretWrap.enter()
            .append( 'div' )
            .classed( 'group-toggle-caret-wrap', true)
            .append( 'div' )
            .attr( 'class', 'adv-opt-toggle' )
            .classed( 'combobox-caret', d => d.members.length )
            .on( 'click', function(d) {
                if (d.members.length) {
                    let body      = d3.select( `#${ d.name }_group` ).select( '.group-body' ),
                        bodyState = body.classed( 'hidden' );

                    body.classed( 'hidden', !bodyState );
                    body.classed( 'keyline-bottom', bodyState );
                }
            });

        caretWrap.merge(caretWrapEnter);
    }

    createGroups() {
        let toggleOption = this.toggleOption,
            setType = this.setType,
            innerWrap = this.innerWrap,
            caretWrap = this.caretWrap,
            advOpts = _cloneDeep( this.advancedOptions ),
            group = this.contentDiv
                .selectAll( '.form-group' )
                .data( advOpts );

        group.exit()
            .remove();
            
        let groupEnter = group.enter()
            .append( 'div' )
            .classed( 'form-group', true )
            .attr( 'id', d => `${d.name}_group`);

        group = group.merge(groupEnter);

        group.each(function(d) {
            let group = d3.select( this ),
                groupToggle = group.selectAll( '.group-toggle' )
                    .data( [ 0 ] );
            
            groupToggle.exit().remove();

            let groupToggleEnter = groupToggle.enter()
                .append( 'div' )
                .classed( 'group-toggle', true );

            groupToggle = groupToggle.merge(groupToggleEnter);

            let toggleWrap = groupToggle.selectAll( '.inner-wrapper' )
                .data( [ d ] );

            toggleWrap.exit().remove();

            let toggleWrapEnter = toggleWrap.enter()
                .append( 'div' )
                .attr( 'class', 'inner-wrapper strong fill-light keyline-bottom adv-opts-toggle-wrap' )
                .attr( 'id', d => `${d.name}-wrap` );

            toggleWrap = toggleWrap.merge(toggleWrapEnter);
            
            toggleWrap
                .call(innerWrap, toggleOption)
                .call(caretWrap);

            let groupBody = group.selectAll( '.group-body' )
                .data( [ d ] );

            groupBody.exit().remove();

            let groupBodyEnter = groupBody.enter()
                .append( 'div' )
                .classed( 'group-body fill-white', true );

            groupBody = groupBody.merge(groupBodyEnter);

            groupBody
                .classed( 'hidden', true );

            let fieldContainer = groupBody.selectAll( '.hoot-form-field' )
                .data( d => d.members );

            fieldContainer.exit().remove();

            let fieldContainerEnter = fieldContainer.enter()
                .append( 'div' )
                .attr( 'id', d => d.id )
                .attr( 'class', d => `hoot-form-field small contain ${d.hidden ? 'hidden': ''}` );

            fieldContainer = fieldContainer.merge(fieldContainerEnter);
            
            fieldContainer.each(function(d) {
                let fieldContainer = d3.select( this );
                
                let fieldLabelWrap = fieldContainer.selectAll( '.hoot-field-label-wrap' )
                    .data([ 0 ]);

                fieldLabelWrap.exit().remove();

                let fieldLabelWrapEnter = fieldLabelWrap.enter()
                    .append( 'div' )
                    .classed('hoot-field-label-wrap', true);
                
                fieldLabelWrap = fieldLabelWrap.merge(fieldLabelWrapEnter);

                let fieldLabel = fieldLabelWrap.selectAll( '.hoot-field-label' )
                    .data( [ d ] );

                fieldLabel.exit().remove();

                let fieldLabelEnter = fieldLabel.enter()
                    .append( 'label' )
                    .classed( 'hoot-field-label', true )
                    .text( d => d.label );

                fieldLabel.merge(fieldLabelEnter);

                let fieldInput = fieldContainer.selectAll( '.hoot-field-input' )
                    .data([ d ]);

                fieldInput.exit().remove();

                let fieldInputEnter = fieldInput.enter()
                    .append( 'input' )
                    .attr( 'class', 'hoot-field-input' )
                    .attr( 'type', setType );
        
                fieldInput = fieldInput.merge(fieldInputEnter);
                
                fieldInput
                    .property( 'value', d => d.default );
            });
            
        });
            
      
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
                    disabledFeatures.push(selection.datum().label.replace(/ to /, ''));
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