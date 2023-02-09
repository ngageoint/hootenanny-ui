/** ****************************************************************************************************
 * File: formFactory.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _map from 'lodash-es/map';

import { d3combobox } from '../../lib/hoot/d3.combobox';

/**
 * Create a form contained within a modal
 *
 * @constructor
 */
export default class FormFactory {

    /**
     * Create a form with all of it's contents using the provided metadata
     *
     * @param selector - where to append container to
     * @param metadata - form data
     * @returns {d3} - form container
     */
    generateForm( selector, formId, metadata ) {
        let container = this.createContainer( selector, formId ),
            wrapper   = this.createWrapper( container ),
            formModal = this.createFormModal( wrapper, formId ),
            form      = this.createForm( container, formModal, metadata.title );

        this.createFieldSets( form, metadata.form );

        if ( metadata.button ) {
            this.createButton( formModal, metadata.button );
        }

        return container;
    }

    /**
     * Create dark background container
     *
     * @param selector - where to append container to
     * @returns {d3} - form container
     */
    createContainer( selector, formId ) {

        // Check if it already exists and delete it if it does
        const formCheck = d3.select( `#${formId}` );
        if ( formCheck ) {
            formCheck.remove();
        }

        let overlay = d3.select( selector )
            .append( 'div' )
            .attr( 'id', formId )
            .classed( 'overlay modal-overlay', true );

        setTimeout( () => overlay.classed( 'visible', true ), 50 );

        return overlay;
    }

    createWrapper( container ) {
        return container
            .append( 'div' )
            .classed( 'wrapper', true );
    }

    /**
     * Create modal
     *
     * @returns {d3} - form modal
     */
    createFormModal( wrapper ) {
        return wrapper
            .append( 'div' )
            .classed( 'contain hoot-menu fill-white round modal', true );
    }

    /**
     * Create form with a header
     *
     * @param container - form container
     * @param modal - form modal
     * @param formTitle - form title
     * @returns {d3} - form wrapper
     */
    createForm( container, modal, formTitle ) {
        let form = modal.append( 'form' );

        let header = form
            .append( 'div' )
            .classed( 'modal-header pad1y big keyline-bottom', true );

        let span = header
            .append( 'h3' );
        span.append('span')
            .text( formTitle );
        span.append( 'div' )
            .classed( 'fr _icon close pointer', true )
            .on( 'click', () => {
                container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );

        return form;
    }

    /**
     * Create each input field in the form
     *
     * @param form - form div
     * @param formMeta - form data
     */
    createFieldSets( form, formMeta ) {
        if ( !formMeta ) return;

        let self = this;

        let fieldsetContainer = form.append( 'fieldset' );

        let fieldContainer = fieldsetContainer
            .selectAll( '.hoot-form-field' )
            .data( formMeta ).enter()
            .append( 'div' )
            .attr( 'class', d => d.class )
            .attr( 'title', d => d.title )
            .classed( 'hoot-form-field fill-white small keyline-all round', true )
            .classed( 'hoot-field-checkbox', d => d.inputType === 'checkbox' )
            .classed('hidden', d => d.hidden );

        if ( fieldContainer.datum().id ) {
            fieldContainer.attr( 'id', d => `${d.id}_container` );
        }

        let fieldHeader = fieldContainer
            .append( 'div' )
            .classed( 'form-field-header fill-light', true )
            .classed( 'round-top keyline-bottom', d => d.inputType !== 'checkbox' )
            .classed( 'keyline-right', d => d.inputType === 'checkbox' );

        fieldHeader
            .append( 'label' )
            .classed( 'strong', true )
            .text( d => d.label );

        fieldHeader.select( function( d ) {
            if ( d.id === 'conflateType' ) {
                let header = d3.select( this )
                    .classed( 'conflate-type-header', true );

                let advOpts = header.append( 'a' )
                    .attr( 'id', 'advanced-opts-toggle' );

                advOpts.append( 'span' )
                    .classed( 'toggle-text', true )
                    .text( 'Advanced Options' );

                advOpts.append( 'span' )
                    .classed( 'toggle-caret inline strong', true )
                    .text( '►' );
            }
        } );

        fieldContainer.select( function( d ) {
            let field = d3.select( this )
                .classed( 'contain', true );

            switch ( d.inputType ) {
                case 'combobox': {
                    if ( d.data ) {
                        self.createCombobox( field );
                    }
                    break;
                }
                case 'multiCombobox': {
                    FormFactory.createMultiCombobox( field );
                    break;
                }
                case 'checkbox': {
                    self.createCheckbox( field );
                    break;
                }
                case 'text': {
                    self.createTextField( field );
                    break;
                }
                case 'textarea': {
                    self.createTextarea( field );
                    break;
                }
                case 'listbox': {
                    self.createListbox( field );
                    break;
                }
                case 'multipart': {
                    self.createMultipart( field );
                    break;
                }
                case 'custom': {
                    d.createCustom( field );
                    break;
                }
                case 'password': {
                    let pw = self.createPasswordField( field );
                    field.select('.form-field-header').append('i')
                        .attr('class', 'password-field-icon material-icons')
                        .text('visibility_off')
                        .on('click', () => {
                            let icon = d3.select(this).select('i');
                            let txt = icon.text();
                            if (txt === 'visibility_off') {
                                icon.text('visibility');
                                pw.attr('type', 'text');
                            } else {
                                icon.text('visibility_off');
                                pw.attr('type', 'password');
                            }

                        });
                    break;
                }
                default: {
                    self.createTextField( field );
                    break;
                }
            }
        } );

        return fieldsetContainer;
    }

    /**
     * Create a custom dropdown menu
     *
     * @param field - field div
     */
    createCombobox( field ) {

        let d = field.datum(),
        comboData = _map(d.data, n => {
            const t = d.itemKey ? n[ d.itemKey ] : n,
                  v = d.valueKey ? n[ d.valueKey ] : t,
                  _v = d._valueKey ? n[ d._valueKey ] : v;
            return { value: v, title: t, _value: _v };
        } ),
        fieldInputWrap = field
            .selectAll( '.hoot-form-field' )
            .data([ comboData ]);

        fieldInputWrap.exit().remove();

        let fieldInputWrapEnter = fieldInputWrap.enter()
            .append('div')
            .classed( 'hoot-field-input-wrap', true );

        fieldInputWrap = fieldInputWrap.merge(fieldInputWrapEnter);


        if (d.sort) {
            comboData = comboData.sort((a, b) => {
                let textA = a.value.toLowerCase(),
                    textB = b.value.toLowerCase();

                return textA < textB ? -1 : textA > textB ? 1 : 0;
            } );
        }

        field
            .append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', d => d.id )
            .attr( 'class', d => d.class )
            .attr( 'autocomplete', 'off' )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'value', d => d.value )
            .attr( '_value', d => d._value )
            .attr( 'disabled', d => d.disabled )
            .attr( 'readonly', d => d.readonly )
            .call(d3combobox().data(comboData))
            .on( 'change', d => d.onChange && d.onChange(d) )
            .on( 'keyup', d => d.onChange && d.onChange(d) );
    }

    /**
     * Create a custom dropdown menu
     *
     * @param field - field div
     */
    static createMultiCombobox( field, skipContainer, afterChangeCallback ) {
        const data = field.datum();

        let comboData = _map(data.data, n => {
            const t = data.itemKey ? n[ data.itemKey ] : n,
                v = data.valueKey ? n[ data.valueKey ] : t,
                _v = data._valueKey ? n[ data._valueKey ] : v;
            return { value: v, title: t, _value: _v };
        } );

        if (data.sort) {
            comboData = comboData.sort((a, b) => {
                let textA = a.value.toLowerCase(),
                    textB = b.value.toLowerCase();

                return textA < textB ? -1 : textA > textB ? 1 : 0;
            } );
        }

        let container;
        if ( skipContainer ) {
            container = field;
        } else {
            container = field.append( 'div' )
                .attr( 'id', d => d.containerId );
        }

        let selectedList = container.append( 'ul' )
            .classed( 'selectedTags multiCombobox', true );

        const combobox = d3combobox().data(comboData);

        const listInput = selectedList.append( 'input' )
            .attr( 'type', 'text' )
            .attr( 'id', d => d.id )
            .attr( 'class', d => d.class )
            .attr( 'autocomplete', 'off' )
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'value', d => d.value )
            .attr( '_value', d => d._value )
            .attr( 'disabled', d => d.disabled )
            .attr( 'readonly', d => d.readonly )
            .call( combobox )
            .on( 'change', d => {
                let tagsContainer = container.select( '.selectedTags' );

                const tagItem = container.select( `#${ d.id }` ),
                    value = tagItem.node().value,
                    _value = tagItem.attr( '_value' );

                // See if the item has already been tagged OR selected for potential tagging
                const isSelected = tagsContainer.selectAll( 'li' ).filter( function() {
                    return d3.select(this).attr( '_value' ) === _value;
                } );

                if ( isSelected.size() === 0 ) {
                    FormFactory.populateTags( container, value, _value, afterChangeCallback );
                }

                listInput.node().value = '';

                if ( afterChangeCallback ) afterChangeCallback();
            } )
            .on( 'keyup', d => d.onChange && d.onChange(d) );

        return combobox;
    }

    // creates the tag list item to show that a list item has been selected and allows removing it from tags
    static populateTags( container, name, id, onDelete ) {
        let listItem = container.select( '.selectedTags' ).append( 'li' )
            .classed( 'tagItem', true )
            .attr( 'value' , name)
            .attr( '_value', id);

        listItem.append( 'span' )
            .text( name );

        listItem.append( 'a' )
            .classed( 'remove', true)
            .text( 'x' )
            .on( 'click', function(d3_event, d) {
                listItem.remove();

                if ( onDelete ) {
                    onDelete();
                }
            });
    }

    populateCombobox( input ) {
        input.select( d => {
            let combobox = d3combobox()
                .data( _map( d.data, n => {
                    const t = d.itemKey ? n[ d.itemKey ] : n,
                          v = d.valueKey ? n[ d.valueKey ] : t;
                    return { value: v, title: t };
                } ) );

            if ( d.sort ) {
                let data = combobox.data();

                data.sort( ( a, b ) => {
                    let textA = a.value.toLowerCase(),
                        textB = b.value.toLowerCase();

                    return textA < textB ? -1 : textA > textB ? 1 : 0;
                } );
            }

            d3.select( input.node() )
                .call( combobox );
        } );
    }

    /**
     * Create a text input
     *
     * @param field - field div
     */
    createTextField( field ) {
        return field
            .append( 'input' )
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
            } )
            .on( 'blur', function( d ) {
                if ( d.onBlur ) {
                    d.onBlur( d, this );
                }
            } );
    }

    /**
     * Create a password input
     *
     * @param field - field div
     */
    createPasswordField( field ) {
        return field
            .append( 'input' )
            .attr( 'type', 'password' )
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
            } )
            .on( 'blur', function( d ) {
                if ( d.onBlur ) {
                    d.onBlur( d, this );
                }
            } );
    }

    /**
     * Create a checkbox input
     *
     * @param field - field div
     */
    createCheckbox( field ) {
        return field
            .append( 'div' )
            .classed( 'hoot-checkbox-wrap', true )
            .append( 'input' )
            .attr( 'type', 'checkbox' )
            .attr( 'id', d => d.id )
            .property( 'checked', d => d.checked )
            .on( 'change', d => d.onChange && d.onChange(d) );
    }

    /**
     * Create a textarea input
     *
     * @param field - field div
     */
    createTextarea( field ) {
        field
            .append( 'textarea' )
            .attr( 'id', d => d.id )
            .attr( 'class', d => d.class )
            .attr( 'readonly', d => d.readOnly )
            .text( d => d.data || '' )
            .on( 'keyup', d => d.onChange && d.onChange( d ) )
            .on( 'drop', d => d.onDrop && d.onDrop() );
    }

    createListbox( field ) {
        field
            .append( 'select' )
            .attr( 'id', d => d.id )
            .attr( 'size', '5' )
            .attr( 'disabled', d => d.readOnly )
            .style( 'height', '90px' );
    }

    /**
     * Create a file upload input
     *
     * @param field - field div
     */
    createMultipart( field ) {
        let wrapper = field.append( 'div' ).classed( 'contain', true );

        this.createTextField( wrapper )
            .on( 'click', function() {
                let evt = new MouseEvent( 'click' );

                d3.select( this.parentNode )
                    .select( '.multipart-icon-button' )
                    .select( 'input' ).node()
                    .dispatchEvent( evt );
            } );

        let span = wrapper.append( 'span' )
            .classed( 'multipart-icon-button pointer keyline-left flex align-center justify-center', true )
            .on( 'click', function() {
                let evt = new MouseEvent( 'click' );

                d3.select( this )
                    .select( 'input' ).node()
                    .dispatchEvent( evt );
            } );

        span
            .append( 'div' )
            .classed( 'material-icons small', true )
            .text( 'folder' );

        span
            .append( 'input' )
            .attr( 'id', d => d.multipartId )
            .attr( 'type', 'file' )
            .attr( 'readonly', true )
            .property( 'multiple', false )
            .attr( 'accept', d => d.accept || null )
            .classed( 'pointer pin-top datasets-file-upload', true )
            .on( 'change', d => d.onChange() );
    }

    /**
     * Create a submit button
     *
     * @param container - container to append element to
     * @param buttonMeta - button data
     */
    createButton( container, buttonMeta ) {
        let buttonContainer = container
            .append( 'div' )
            .classed( 'modal-footer', true );

        buttonContainer.append('div')
            .classed( 'sideContainer', true );

        let button = buttonContainer
            .append( 'button' )
            .attr( 'disabled', (buttonMeta.disabled !== undefined) ? buttonMeta.disabled : true )
            .attr( 'id', buttonMeta.id )
            .classed( 'round strong primary', true )
            .on( 'click', buttonMeta.onClick );

        button
            .append( 'span' )
            .text( buttonMeta.text );

        buttonContainer.append( 'div' )
            .attr( 'class', 'sideContainer processWaiter' );
    }

    createProcessSpinner( container ) {
        let spinnerContainer = container.select( '.processWaiter' );

        let spinner = spinnerContainer.append('img')
            .attr( 'id', 'processSpinner' )
            .attr( 'src', Hoot.context.imagePath('loader-white.gif') )
            .style( 'opacity', 0);

        spinner.transition().style( 'opacity', 1);
    }

    removeProcessSpinner( container ) {
        let spinnerContainer = container.select( '.processWaiter' ),
            spinner          = spinnerContainer.select( '#processSpinner' );


        spinner.transition().style( 'opacity', 0 );
        spinnerContainer.remove();
    }

    /*
    * Reformats an advanced opt object
    * to one compatible with Form Factory
    */
    advOpt2DomMeta( opt ) {
        let domMeta = {
            label: opt.label,
            id: opt.id,
            inputType: opt.input,
            title: opt.description,
            hidden: opt.hidden || false,
            class: 'advOpt'
        };

        if (opt.input === 'checkbox') {
            if (opt.default === 'true')
                domMeta.checked = true;
        } else {
            domMeta.placeholder = opt.default;
        }

        if ( opt.data ) {
            domMeta.data = opt.data;
            if (opt.itemKey) domMeta.itemKey = opt.itemKey;
            if (opt.valueKey) domMeta.valueKey = opt.valueKey;
            if (opt.displayToHootMap) domMeta.displayToHootMap = opt.displayToHootMap;
        }

        return domMeta;
    }

    /*
    * Creates an advanced options section toggle
    * to control visibility of advanced option controls
    */
    createToggle( container ) {
        let iconText = 'arrow_right';
        let fldset = container.selectAll('fieldset');
        fldset.classed('hidden', true);
        let toggle = container
            .select('form')
            .insert( 'h4', 'fieldset' )
            .attr( 'id', 'advOpts' )
            .on('click', () => {
                let shown = icon.text() !== iconText;
                if (!shown) {
                    fldset.classed('hidden', false);
                    icon.text('arrow_drop_down');
                }
                fldset.transition()
                    .duration(200)
                    .style('height', shown ? '0px' : fldset.clientHeight)
                    .on('end', () => {
                        if (shown) {
                            fldset.classed('hidden', true);
                            icon.text(iconText);
                        }
                    });
            });
        let icon = toggle.append('i')
            .classed( 'material-icons', true )
            .text(iconText);
        toggle.append('span')
            .text( 'Advanced Options' );
    }

    /**
     * Compares state of
     * advanced options to defaults and
     * adds to params if different
     */
    getAdvOpts(container, advOpts) {
        let advParams = {};

        if ( advOpts ) {
            advOpts.forEach(function(d) {
                let inputValue;

                switch (d.input) {
                    case 'multiCombobox': {
                        const parent = container.select('#' + d.id).node().parentNode;
                        inputValue = d3.select( parent ).selectAll( '.tagItem' ).nodes().map( data =>
                            d3.select(data).attr('_value')
                        );
                        break;
                    }
                    case 'checkbox':
                        inputValue = container.select('#' + d.id).property('checked').toString();
                        break;
                    case 'text':
                    default:
                        inputValue = container.select('#' + d.id).property('value').toString();
                        break;
                }

                // Need .length check because empty text box should be considered equal to default
                if ( inputValue.length && inputValue !== d.default ) {
                    if ( Array.isArray(inputValue) ) {
                        advParams[d.id] = inputValue.map( item => d.displayToHootMap ? d.displayToHootMap[item] : item)
                            .join( ';' );
                    } else {
                        advParams[d.id] = d.displayToHootMap ? d.displayToHootMap[inputValue] : inputValue;
                    }
                }
            });
        }

        return advParams;
    }
}
