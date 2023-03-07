/*******************************************************************************************************
 * File: advancedOpts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/23/18
 *******************************************************************************************************/

import _cloneDeep from 'lodash-es/cloneDeep';
import _map       from 'lodash-es/map';
import _isEmpty   from 'lodash-es/isEmpty';
import _isBoolean from 'lodash-es/isBoolean';
import _forEach   from 'lodash-es/forEach';

import { d3combobox } from '../../../lib/hoot/d3.combobox';
import { svgIcon }    from '../../../svg';
import { tooltip }    from '../../../util/tooltip';
import SaveFavoriteOpt from '../modals/saveFavoriteOpt';
import DeleteFavoriteOpt from '../modals/deleteFavoriteOpt';
import FormFactory from '../../tools/formFactory';


let instance = null;
export default class AdvancedOpts {
    constructor() {
        this.sidebar                = d3.select( '#hoot-sidebar' );
        this.advancedOptions        = [];
        this.conflationOptions      = {};
        this.favoriteOptions        = {};
        this.favoritesOptionsSource = [];
        this.favOptToRemove         = [];
        this.showing                = false;
        this.formFactory            = new FormFactory();
    }

    static getInstance() {
        if (instance === null) {
            instance = new AdvancedOpts();
        }
        return instance;
    }

    get isOpen() {
        return this.form && this.form.classed( 'visible' );
    }

    async init() {
        if ( _isEmpty( this.conflationOptions ) ) {
            this.conflationOptions = await Hoot.api.getAdvancedOptions('conflationOptions');
        }

        if ( _isEmpty(this.favoriteOptions) ) {
            this.favoriteOptions = await Hoot.api.getFavoriteAdvOpts();
            let favOpts = this.favoriteOptions;
            let favOptsGroup = [];
            if ( favOpts ) {
                Object.keys( favOpts ).forEach( function(a) { if ( favOpts[a] ) {
                    let parseTest = JSON.parse( favOpts[a] );
                    favOptsGroup.push(parseTest);
                } });
            }
            this.favoriteOptions = favOptsGroup;
        }
        if ( !this.advancedOptions.length ) {
            this.advancedOptions = await Hoot.api.getAdvancedOptions('hoot2');
            this.render(_cloneDeep(this.advancedOptions));
        }
    }

    render(advOpts) {
        this.createContainer();
        this.createHeader();
        this.createContentDiv();
        this.createGroups(advOpts);
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

        let favoritesBar = header
            .append( 'div' )
            .classed( 'favorites-container', true );

        // reset button
        favoritesBar
            .append( 'div' )
            .classed( 'fav-button-placement', true )
            .append( 'button' )
            .classed( 'advanced-opts-reset button secondary strong', true )
            .text( 'Reset' )
            .on( 'click', () => {
                let showingOpts = [];
                d3.selectAll('.group-body.fill-white')
                    .each(function(a) {
                        if ( !this.classList.contains('hidden') ) {
                            showingOpts.push(a.name);
                        }
                    } );
                let optsToRemove = instance.favOptToRemove;
                if (optsToRemove.length > 0) {
                    optsToRemove.forEach(o => {
                        d3.select(`.opt-${o.id}`).style('fill', '#000000');
                    });
                }
                // hide all fav opt buttons
                d3.select('#saveFav').classed('hidden', true);
                d3.select('#updateFav').classed('hidden', true);
                d3.select('#deleteFav').classed('hidden', true);
                d3.select('#conflateType').property('value', 'Reference');
                this.createGroups(this.advancedOptions, showingOpts);
            });

        favoritesBar
            .append( 'div' )
            .classed( 'fav-button-placement', true )
            .append( 'button' )
            .classed( 'advanced-opts-reset button secondary strong hidden', true )
            .attr( 'id', 'saveFav')
            .text( 'Save Favorite' )
            .on('click', async item => {

                let currentFavorites = Hoot.config.users[Hoot.user().id].members;

                this.saveOpts = new SaveFavoriteOpt(currentFavorites).render();

                this.saveOpts.saveOpt[0].data = this.savingFavoriteOpts();

                Hoot.events.once('modal-closed', () => delete this.saveOpts);

                return this;

            });

        favoritesBar
            .append( 'div' )
            .classed( 'fav-button-placement', true )
            .append( 'button' )
            .classed( 'advanced-opts-reset button secondary strong hidden', true )
            .attr( 'id', 'updateFav')
            .text( 'Update Favorite' )
            .on( 'click', async function() {
                let activeFavorite = d3.select( '#conflateType' ).property( 'value' );

                let optUpdate = instance.favoritesOptionsSource.filter( opt => opt.name === activeFavorite );

                let toUpdate =  instance.updateFavoriteOpt( optUpdate );

                let updateOpt = {
                    conflateType: optUpdate.conflateType,
                    name: activeFavorite,
                    members: {
                        members: toUpdate,
                        name: activeFavorite,
                        label: activeFavorite,
                    }
                };

                await Hoot.api.saveFavoriteOpts( updateOpt );

                await Hoot.getAllUsers();


                Hoot.message.alert( {
                    message: 'Fav. Opts Updated Successfully',
                    type: 'success'
                } );
            } );

        favoritesBar
            .append( 'div' )
            .classed( 'fav-button-placement', true )
            .append( 'button' )
            .classed( 'advanced-opts-reset button secondary strong hidden', true )
            .attr( 'id', 'deleteFav')
            .text( 'Delete Favorite' )
            .on( 'click', function() {
                new DeleteFavoriteOpt().handleSubmit();
            } );

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

    toggleOption(d, shouldHide = false, fromLabel = false) {
        let label = d3.select( `#${d.name}_label` ),
            parent = d3.select( `#${d.name}_group` ),
            input = d3.select( `#${d.name}-toggle` ),
            body = d3.select( `#${ d.name }_group .group-body`);

        parent
            .select( '.group-toggle-caret-wrap' )
            .classed( 'toggle-disabled', !shouldHide );

        label
            .classed( 'adv-opt-title-disabled', !shouldHide );

        if (fromLabel) {
            input.property('checked', shouldHide);
        }

        if (shouldHide) {
            parent.select( '.group-body' )
                .classed( 'hidden', true );
        }

        if (!body.classed( 'hidden' )) {
            body.classed('hidden', true);
        }

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

        let innerWrapLeft = innerWrap.selectAll( '.adv-opts-inner-wrap-left' )
            .data([ 0 ]);

        innerWrapLeft.exit().remove();

        let innerWrapLeftEnter = innerWrapLeft.enter()
            .append( 'div' )
            .classed( 'adv-opts-inner-wrap-left', true );

        innerWrapLeft = innerWrapLeft.merge(innerWrapLeftEnter);

        //prevent adding checkbox w/in fav opt row
        let favOptCheck = instance.checkFavOptSend();

        if ( !['Cleaning', 'General', 'Attribute', 'Differential'].includes(d.name) && !favOptCheck ) {
            let innerInput = innerWrapLeft.selectAll( '.conflate-type-toggle' )
                .data( [ d ] );

            innerInput.exit().remove();

            let innerInputEnter = innerInput.enter()
                .append( 'input' )
                .classed( 'conflate-type-toggle', true );

            innerInput.merge(innerInputEnter)
                .attr( 'type', 'checkbox' )
                .attr( 'id', d => `${d.name}-toggle` )
                .property( 'checked', true )
                .on('click', function(d) {
                    let shouldHide = d3.select(this).property('checked');
                    instance.toggleOption(d, shouldHide);
                });
        }

        let innerLabelWrap = innerWrap.selectAll( '.adv-opt-title-wrap' )
            .data( [ d ] );

        innerLabelWrap.exit().remove();

        let innerLabelWrapEnter = innerLabelWrap.enter()
            .append( 'div' )
            .classed( 'adv-opt-title-wrap', true );

        innerLabelWrap = innerLabelWrap.merge(innerLabelWrapEnter);

        let innerLabel = innerLabelWrap.selectAll( '.adv-opt-title' )
            .data([ d ]);

        innerLabel.exit().remove();

        let innerLabelEnter = innerLabel.enter()
            .append( 'span' )
            .classed( 'adv-opt-title', true );

        innerLabel = innerLabel.merge(innerLabelEnter)
            .attr( 'id', d => `${ d.name }_label` )
            .classed( 'adv-opt-title-disabled', false )
            .classed( 'adv-opts-group-title', true)
            .text( d => d.members.length ? `${d.label} Options` : d.label);

        innerLabel.on('click', function() {
            let input = d3.select( `#${d.name}-toggle` );

            if (input.empty()) return;

            let shouldHide = d3.select(this).classed('adv-opt-title-disabled');
            instance.toggleOption(d, shouldHide, true);
        });

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
            .classed( 'combobox-caret', d => d.members.length );

        caretWrap.merge(caretWrapEnter);
    }

    showBody(d) {
        if (d3.event.target.classList.contains( 'conflate-type-toggle' ) ||
            d3.event.target.classList.contains( 'adv-opts-group-title' )) {
            return;
        }
        if (d.members.length) {
            let bodyState = d3.select( `#${ d.name }_group .group-body` ).classed( 'hidden' );
            d3.selectAll('.advanced-opts-content .form-group .group-body')
                .classed('hidden', function(data) {
                    if (data.name === d.name) {
                        let disabled = d3.select(this.parentElement)
                            .select('.adv-opts-group-title')
                            .classed('adv-opt-title-disabled');

                        return disabled || !bodyState;
                    } else {
                        return true;
                    }
                })
                .classed('keyline-bottom', function(data) {
                    if (data.name === d.name) {
                        let disabled = d3.select(this.parentElement)
                            .select('.adv-opts-group-title')
                            .classed('adv-opt-title-disabled');

                        return disabled || !bodyState;
                    } else {
                        return false;
                    }
                });
        }
    }

    toggleDescription(fieldContainer) {
        fieldContainer.select('.hoot-field-label-button')
            .on('click', function() {
                fieldContainer.select('p').classed('hidden', !fieldContainer.select('p').classed('hidden') );
            });
    }

    fieldLabel(fieldContainer) {
        let d = fieldContainer.datum(),
            fieldLabelWrap = fieldContainer
                .selectAll( '.hoot-field-label-wrap' )
                .data([ d ]);

        fieldLabelWrap.exit().remove();

        let fieldLabelWrapEnter = fieldLabelWrap.enter()
            .append( 'div' )
            .classed('hoot-field-label-wrap', true );


        fieldLabelWrap = fieldLabelWrap.merge(fieldLabelWrapEnter);

        fieldLabelWrap
            .classed( 'adv-opts-header fill-light keyline-bottom round-top', true )
            .classed( 'keyline-bottom', d => d.input !== 'checkbox' )
            .classed( 'round-left hoot-field-title-checkbox-wrap keyline-right', d => d.input === 'checkbox' );

        let fieldLabel = fieldLabelWrap.selectAll( '.hoot-field-label' )
            .data( [ d ] );

        fieldLabel.exit().remove();

        let fieldLabelEnter = fieldLabel.enter()
            .append( 'label' )
            .classed( 'hoot-field-label', true );


        fieldLabel.merge(fieldLabelEnter)
            .text( d => d.label );

        let fieldLabelButtonContainer = fieldLabelWrap.selectAll( '.hoot-field-button-container' )
            .data( [d] );

        fieldLabelButtonContainer.exit().remove();

        let fieldLabelButtonContainerEnter = fieldLabelButtonContainer.enter()
            .append('div')
            .classed( 'hoot-field-button-container', true );

        fieldLabelButtonContainer = fieldLabelButtonContainer.merge(fieldLabelButtonContainerEnter);

        let fieldLabelButton = fieldLabelButtonContainer.selectAll( '.hoot-field-label-button' )
            .data( [d] );

        fieldLabelButton.exit().remove();

        let fieldButtonEnter = fieldLabelButton.enter()
            .append('button')
            .classed('hoot-field-label-button', true )
            .call(svgIcon('#iD-icon-inspect', 'adv-opt-icon', ''));

        fieldLabelButton = fieldLabelButton.merge(fieldButtonEnter);

        let fieldLabelDeleteButton = fieldLabelButtonContainer.selectAll( '.hoot-field-label-delete-button' )
        .data( [d] );

        fieldLabelDeleteButton.exit().remove();

        let fieldDeleteButtonEnter = fieldLabelDeleteButton.enter()
            .append('button')
            .classed('hoot-field-label-delete-button delete-button icon-button keyline-left round-right inline', true)
            .call(svgIcon('#iD-operation-delete', `remove-opt-icon opt-${d.id}`, ''))
            .on( 'click', function(d) {
                if (!AdvancedOpts.getInstance().favOptToRemove.includes(d)) {
                    d3.select(`.opt-${d.id}`).style('fill', '#E34234');
                    AdvancedOpts.getInstance().favOptToRemove.push(d);
                }
            });

        fieldLabelDeleteButton = fieldLabelDeleteButton.merge(fieldDeleteButtonEnter);
    }

    fieldInput(fieldContainer, isCleaning, isFavorites) {
        let d = fieldContainer.datum(),
            fieldInputWrap = fieldContainer
                .selectAll( '.hoot-field-input-wrap' )
                .data([ d ]);

        fieldInputWrap.exit().remove();

        let fieldInputWrapEnter = fieldInputWrap.enter()
            .append('div')
            .classed( 'hoot-field-input-wrap', true );

        fieldInputWrap = fieldInputWrap.merge(fieldInputWrapEnter);

        fieldInputWrap
            .classed( 'hoot-field-input-checkbox-wrap', d => d.input === 'checkbox' );

        let fieldInput = fieldInputWrap.selectAll( '.hoot-field-input' )
            .data( [ d ] );

        fieldInput.exit().remove();

        let fieldInputEnter = fieldInput.enter()
            .append( 'input' )
            .attr( 'class', 'hoot-field-input' );

        fieldInput = fieldInput.merge(fieldInputEnter)
            .attr( 'type', d => d.input === 'checkbox' ?  'checkbox' : 'text' ); // combobox & text get text input...

        fieldInput
            .attr( 'placeholder', d => d.placeholder )
            .attr( 'disabled', d => d.disabled )
            .attr( 'readonly', d => d.readonly )
            .property( 'checked', isCleaning);

        const type = fieldInput.datum().input;

        if ( type === 'checkbox' ) {
            fieldInput
                .property( 'checked', d => d.default.toString() === 'true' )
                .on( 'click', function(d) {
                    d.send = JSON.parse( d.default ) !== d3.select( this ).property( 'checked' );
                    if ( d3.select(`#${d.id}`).property('checked') !== d.default && d3.select('#updateFav').classed('hidden') ) {
                        //make save favorite opt button visible
                        d3.select('#saveFav').classed('hidden', false );
                    }
                });
            let sendFavorites = instance.checkFavOptSend();

            if ( sendFavorites ) {
                d.send = true;
            }

        } else {
            fieldInput
                .property( 'value', d => d.default );

            if ( type === 'combobox' ) {
                let d = fieldInput.datum(),
                    comboData = _map(d.data, n => {
                        const t = d.itemKey ? n[ d.itemKey ] : n,
                            v = d.valueKey ? n[ d.valueKey ] : t;
                        return { value: v, title: t };
                    } );

                if ( d.sort ) {
                    comboData = comboData.sort((a, b) => {
                        let textA = a.value.toLowerCase(),
                            textB = b.value.toLowerCase();

                        return textA < textB ? -1 : textA > textB ? 1 : 0;
                    } );
                }

                fieldInput
                    .classed( 'form-field-combo-input', true )
                    .attr( 'autocomplete', 'off' )
                    .call(d3combobox().data( comboData ))
                    .on( 'change', function(d) {
                        d.send =  d3.select( this ).property( 'value' ) !== d.default;

                    })
                    .on( 'keyup', function(d) {
                        d.send =  d3.select( this ).property( 'value' ) !== d.default;
                    });

                let sendFavorites = instance.checkFavOptSend();

                if ( sendFavorites ) {
                    d.send = true;
                }

            } else if ( type === 'multiCombobox' ) {
                const container = d3.select( fieldInput.node().parentNode );
                container.selectAll('*').remove();
                const combobox = FormFactory.createMultiCombobox( container, true, () => {
                    d.send = container.selectAll( '.tagItem' ).size() > 0;
                } );


                combobox.onOpen( () => {
                    const data = container.datum();

                    if ( data.matcherMap && data.displayToHootMap ) {
                        const disabledOpts = AdvancedOpts.getInstance().getDisabledFeatures();

                        let optsList = disabledOpts.reduce((results, opt) => {
                            if ( data.matcherMap[ opt ] ) {
                                results.push( Object.keys( data.displayToHootMap ).find( key => data.displayToHootMap[key] === data.matcherMap[ opt ] ) );
                            }
                            return results;
                        }, []);

                        combobox.setDisabled( optsList );
                    }
                } );


                container.classed('hoot-field-input-multicombo', true);
            } else { // text input...
                fieldInput
                    .classed( instance.favoriteCheck(isFavorites, fieldInput), true)
                    .on( 'keyup', function(d) {
                        let value = d3.select( this ).property( 'value' );
                        d.send = value !== d.default;
                        if ( d3.select(`#${d.id}`).property('value') !== d.default && d3.select('#updateFav').classed('hidden') ) {
                            //make save favorite opt button visible
                            d3.select('#saveFav').classed('hidden', false );
                        }
                        if ([ 'double', 'int', 'long' ].indexOf ( d.type ) !== -1 ) {
                            d3.select( `#${d.id}-label-wrap` )
                                .call(instance.notNumber, value);
                        }
                    });
                let sendFavorites = instance.checkFavOptSend();

                if ( sendFavorites ) {
                    d.send = true;
                }

            }

        }

    }

    fieldDescription(fieldContainer) {

        let d = fieldContainer.datum(),
            fieldDescriptionWrap = fieldContainer
                .selectAll( `#${d.id}` )
                .data([ d ]);

        fieldDescriptionWrap.exit().remove();

        let fieldDescriptionWrapEnter = fieldDescriptionWrap.enter()
            .append('div');

        fieldDescriptionWrap = fieldDescriptionWrap.merge(fieldDescriptionWrapEnter);

        let fieldOpt = fieldContainer.selectAll(`#${d.id}`)
            .data([d]);

        fieldOpt.exit().remove();

        let fieldOptDescEnter = fieldOpt.enter()
            .append('p')
            .classed('hidden', true )
            .classed( 'adv-opt-reference keyline-top', true );


        fieldOpt = fieldOpt.merge(fieldOptDescEnter)
            .text( d.description ? d.description : 'no description available');

        fieldContainer.classed('hoot-form-field-checkbox-clicked', d.input === 'checkbox');
        instance.toggleDescription(fieldContainer);
    }

    notNumber(selection, value) {
        let isNumber = !isNaN( value ),
            notNumber = selection
                .selectAll( '.not-number-warning' )
                .data([ 0 ]);

        let notNumberEnter = notNumber.enter()
            .append( 'span' )
            .classed( 'not-number-warning', true );

        notNumber = notNumber.merge(notNumberEnter);
        notNumber.classed( 'hidden', isNumber );

        if ( notNumber.selectAll( '.tooltip' ).empty() ) {
            notNumber
                .call(svgIcon('#iD-icon-alert', 'deleted'))
                .call(tooltip().title('this option must be a number!'));

            notNumber.selectAll( '.tooltip-arrow' )
                .classed( 'hidden', true );

            notNumber.selectAll( '.tooltip-inner' )
                .style( 'background-color', 'rgba(0,0,0,0)')
                .style( 'border', 'none');

        }

        notNumber.dispatch( isNumber ? 'mouseleave' : 'mouseenter' );
    }

    createGroups(advOpts, showingOpts = [] ) {

        this.favoritesOptionsSource = advOpts;

        let optCheck = advOpts[0];

        if ( optCheck.conflateType || advOpts.length === 1 ) {
            advOpts = this.getSaveGroups(optCheck);
        }

        let group = this.contentDiv
            .selectAll( '.form-group' )
            .data( advOpts );

        group.exit()
            .remove();

        let groupEnter = group.enter()
            .append( 'div' )
            .classed( 'form-group', true );

        group = group.merge(groupEnter)
            .attr( 'id', d => `${d.name}_group` );

        group.each(function(d) {
            let group = d3.select( this ),
                groupToggle = group.selectAll( '.group-toggle' )
                    .data( [ 0 ] );

            groupToggle.exit().remove();

            let groupToggleEnter = groupToggle.enter()
                .append( 'div' )
                .classed( 'group-toggle', true );

            groupToggle = groupToggle
                .merge(groupToggleEnter)
                .on('click', () => instance.showBody(d));

            let toggleWrap = groupToggle.selectAll( '.inner-wrapper' )
                .data( [ d ] );

            toggleWrap.exit().remove();

            let toggleWrapEnter = toggleWrap.enter()
                .append( 'div' )
                .attr( 'class', 'inner-wrapper strong fill-light keyline-bottom adv-opts-toggle-wrap' );

            toggleWrap = toggleWrap.merge(toggleWrapEnter)
                .attr( 'id', d => `${d.name}-wrap` );

            toggleWrap
                .call(instance.innerWrap, instance.toggleOption)
                .call(instance.caretWrap);

            let defaultDisables = ['Attribute', 'Differential'];
            if ( defaultDisables.indexOf(d.name) !== -1 ) {
                let shouldDisable = d3.select( '#conflateType' ).property( 'value' ).includes( d.name );
                group.select( '.adv-opt-title' )
                    .classed( 'adv-opt-title-disabled', !shouldDisable );

                group.select( '.adv-opt-toggle' )
                    .classed( 'toggle-disabled', !shouldDisable );
            }

            let groupBody = group.selectAll( '.group-body' )
                .data( [ d ] );

            groupBody.exit().remove();

            let groupBodyEnter = groupBody.enter()
                .append( 'div' )
                .classed( 'group-body fill-white', true );

            groupBody = groupBody.merge(groupBodyEnter);

            groupBody
                .classed('hidden', !showingOpts.includes(d.name));

            let fieldContainer = groupBody.selectAll( '.hoot-form-field' )
                .data( d => d.members );

            fieldContainer.exit().remove();

            let fieldContainerEnter = fieldContainer.enter()
                .append( 'div' )
                .classed( 'hoot-form-field small contain keyline-all round', true );

            fieldContainer = fieldContainer.merge(fieldContainerEnter)
                .attr( 'id', d => d.id )
                .attr( 'title', d => d.description );

            fieldContainer
                .classed( 'hoot-form-field-wrap', true )
                .classed( 'hoot-form-field-checkbox', d => d.input === 'checkbox' )
                .classed( 'hoot-form-field-input', d => d.input !== 'checkbox' );

            const isCleaning = d.name === 'Cleaning';

            fieldContainer.each(function (d) {
                let fieldContainer = d3.select(this);

                fieldContainer
                    .call(instance.fieldLabel)
                    .call(instance.fieldInput, isCleaning, advOpts)
                    .call(instance.fieldDescription);
            });
        });
    }

    /**
     * Returns list of all conflation types with unchecked (disabled) checkboxes...
     */
    getDisabledFeatures() {
        let disabledFeatures = [];
        this.contentDiv
            .selectAll( '.conflate-type-toggle' )
            .each(function() {
                let selection = d3.select( this );

                if ( !selection.property( 'checked' ) ) {
                    disabledFeatures.push(selection.datum().label.replace(/ to /, ''));
                }
            } );

        return disabledFeatures;
    }

    getOptions() {
        let conflationOptions = this.conflationOptions;

        function shouldSend( d, conflateType, value ) {
            let shouldSend = true;

            if ( conflateType === 'reference' ) {
                return shouldSend;
            }

            let favCheck = instance.checkFavOptSend();

            if ( favCheck ) {
                return shouldSend;
            }

            let confOption = conflationOptions[conflateType][ d.id ];

            if ( confOption && (d.input === 'checkbox' ? JSON.parse(confOption) : confOption) === value ) {
                shouldSend = false;
            }

            return shouldSend;
        }

        function empty( value ) {
            return !_isBoolean( value ) && _isEmpty( value );
        }

        let options = { advanced: {}, cleaning: [] };
        let jsonFieldIds = new Set();
        let conflateType = d3.select( '#conflateType' ).property( 'value' ).toLowerCase();
        this.contentDiv.selectAll( '.form-group' ).each( function( formGroup ) {
            let selection = d3.select( this );
            let isCleaning = formGroup.name === 'Cleaning';

            selection.selectAll( '.hoot-form-field' ).each( function( formField ) {

                if ( !formField.send ) {
                    return; // if no d.send, then input value never changed from default...
                }

                let value;
                let currentElement = d3.select( this );
                if ( formField.input === 'multiCombobox' ) {
                    value = currentElement.selectAll( '.tagItem' ).nodes().map( data =>
                        d3.select(data).attr('_value')
                    );
                } else {
                    value = currentElement.select( 'input' )
                        .property( formField.input === 'checkbox' ? 'checked' : 'value' );
                }

                if ( formField.displayToHootMap ) {
                    if ( Array.isArray(value) ) {
                        value = value.map( item => formField.displayToHootMap ? formField.displayToHootMap[item] : item)
                            .join( ';' );
                    } else {
                        value = formField.displayToHootMap[ value ];
                    }
                }

                if ( empty( value ) || !shouldSend( formField, conflateType, value ) ) {
                    return; // if no value or value is equal to default in conflateOption config...
                }

                if ( !isCleaning ) {
                    if ( formField.type === 'json' ) {
                        jsonFieldIds.add( formField.id );
                        if ( !options.advanced[ formField.id ] ) options.advanced[ formField.id ] = {};
                        if ( !options.advanced[ formField.id ][ formField.parentKey ] ) options.advanced[ formField.id ][ formField.parentKey ] = [];

                        let obj = {};

                        formField.keysList.forEach( key => {
                            if ( key === 'distance' ) {
                                obj[ key ] = value;
                            } else {
                                obj[ key ] = formField[ key ];
                            }
                        } );

                        options.advanced[ formField.id ][ formField.parentKey ].push( obj );
                    } else {
                        options.advanced[ formField.id ] = value;
                    }
                } else {
                    options.cleaning.push( formField.id );
                }
            });

            for ( let id of jsonFieldIds ) {
                options.advanced[ id ] = JSON.stringify( options.advanced[ id ] );
                jsonFieldIds.delete( id );
            }
        });

        return options;
    }

    favoriteCheck(favorite, input) {
        let type = d3.select( '#conflateType' ).property( 'value' ).toLowerCase();

        if ( type === favorite[0].name ) {
            return 'favopt';
        }
        else {
            if ( input.property('classList').contains('favopt') ) {
                input.classed('favopt', false );
            }
            return 'text-input';
        }
    }

    updateFavoriteOpt( toUpdate ) {

        let getMem = [];
        let optToRemve = instance.favOptToRemove;

        toUpdate[0].members.forEach( function(m) {
            getMem.push( m );
        } );

        if ( optToRemve.length > 0 ) {
            getMem = getMem.filter(function(o1){
                return !optToRemve.some(function(o2){
                    return o1.id === o2.id;
                });
            });
            instance.favOptToRemove = [];
        }

        let updateOpts = [];

        function flatten( arr ) {
            return arr.reduce( function( flat, toFlatten) {
                return flat.concat( Array.isArray(toFlatten) ?
                    flatten(toFlatten)
                    : checkType(toFlatten) );
            }, []);
        }

        function checkType( member ) {
            let selectedOpt = {
                input: member.input,
                default: d3.select(`#${member.id}`).select('input').property(member.input === 'checkbox' ? 'checked' : 'value'),
                id: member.id,
                description: member.description,
                label: member.label,
                type: member.type,
                option: member.option,
                parentKey: member.parentKey
            };
            if ( member.keysList ) {
                selectedOpt.keysList = member.keysList;
                member.keysList.forEach( key => selectedOpt[key] = member[key] );
            }

            updateOpts.push( selectedOpt );
        }

        flatten(getMem);

        return updateOpts;
    }

    savingFavoriteOpts() {

        let getAdvOptMembers = [];

        this.favoritesOptionsSource.forEach( function(m) {
            m.members.option = m.name;
            getAdvOptMembers.push( m.members );
        } );

        let getSelectedOpts = [];

        function flatten( arr ) {
            let memOption = arr.option;
            return arr.reduce( function( flat, toFlatten) {
                return flat.concat( Array.isArray(toFlatten) ?
                    flatten(toFlatten)
                    : checkType(toFlatten, memOption ) );
            }, []);
        }

        function checkType( member, option ) {
            let checkVal, defaultValue;
            if ( member.input === 'checkbox' ) {
                defaultValue = d3.select( `#${member.id}` ).select('input').property( 'checked' );
                checkVal = defaultValue.toString();
            } else {
                defaultValue = d3.select( `#${member.id}` ).select('input').property( 'value' );
                checkVal = defaultValue;
            }

            if ( member.default !== checkVal ) {
                let selectedOpt = {
                    input: member.input,
                    default: defaultValue,
                    id: member.id,
                    description: member.description,
                    label: member.label,
                    type: member.type,
                    option: option,
                    parentKey: member.parentKey
                };
                if ( member.keysList ) {
                    selectedOpt.keysList = member.keysList;
                    member.keysList.forEach( key => selectedOpt[key] = member[key] );
                }

                getSelectedOpts.push( selectedOpt );
            }
        }

        flatten(getAdvOptMembers);

        return getSelectedOpts;
    }

    getCurrentFavorites() {

        let currentFavorites = [];

        let favoritesObject  = Hoot.config.users[Hoot.user().id].members;

        Object.keys(favoritesObject)
            .forEach( function(key) {
                currentFavorites.push( JSON.parse( favoritesObject[key] ) );
            } );

        return currentFavorites;
    }

    checkFavOptSend() {
        let getFavs = this.getCurrentFavorites();
        let checkType = getFavs.some(x => x.name === d3.select('#conflateType').property('value') );
        return checkType;
    }

    getSaveGroups( advOpts ) {
        let saveGroup   = [];
        let optionCheck = [];

        // pull advanced option name from saved fav opt
        _forEach( advOpts.members, function(member) {
            if ( !optionCheck.includes( member.option ) ) {
                optionCheck.push( member.option );

                saveGroup.push(
                    {
                        label: member.option,
                        members: [],
                        name: member.option
                    }
                );
            }

            // place custom fav opt member values within adv opt group
            _forEach( saveGroup, function( group ) {
                if ( group.name === member.option ) {
                    group.members.push( member );
                }
            } );
        } );

        return saveGroup;
    }
}
