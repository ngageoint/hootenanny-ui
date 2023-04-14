import FormFactory          from './formFactory';
import GrailPull            from './grailPull';
import selectBounds           from './selectBounds';
import DifferentialChangeset   from './differentialChangeset';
import { select as d3_select } from 'd3-selection';

export default class OverpassQueryPanel {
    constructor( instance ) {
        this.formData = instance;
    }

    render() {
        const titleText = 'Enter Custom Query or Skip to Use Default';
        let buttonText = 'Skip';

        // If user clicks back from grail pull stats modal we want the button to say next instead of skip if there
        // was previous input
        const containerExists = this.formData.overpassQueryContainer;
        if ( containerExists ) {
            let checkboxStatus = containerExists.select('input').property('checked');
            if (checkboxStatus) {
                buttonText = 'Next';
            }
        }

        let metadata = {
            title: titleText,
            button: {
                text: buttonText,
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'overpassTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3_select( `#${ metadata.button.id }` );

        this.addBackButton( metadata.button.id );
        this.submitButton.property( 'disabled', false );

        this.overpassQueryPanel();
    }

    addBackButton( nextButtonId ) {
        const backButton = this.form.select( '.modal-footer' )
            .insert( 'button', `#${ nextButtonId }` )
            .classed( 'round strong primary', true )
            .on( 'click', () => {
                this.form.remove();

                const grailSelectBounds = new selectBounds( this.formData.context, this.formData );
                grailSelectBounds.render( this.formData.operationName );
            } );

        backButton.append( 'span' )
            .text( 'Back' );
    }

    async overpassQueryPanel() {
        // construct input section for user custom overpass queries
        this.overpassQueryContainer = this.form
            .select( '.wrapper div' )
            .insert( 'div', '.modal-footer' )
            .classed( 'button-wrap user-input', true );

        const defaultValue = await Hoot.api.getDefaultOverpassQuery();

        let overpassQueryValue = defaultValue,
            checkboxStatus = false;
        const containerExists = this.formData.overpassQueryContainer;
        if ( containerExists ) {
            checkboxStatus = containerExists.select('input').property('checked');
            overpassQueryValue = containerExists.select( 'textarea' ).property( 'value' );
        }

        const checkboxLabel = this.overpassQueryContainer
            .append( 'label' )
            .text( 'Custom Overpass query' )
                .append( 'input' )
                .attr( 'id', 'customQueryToggle' )
                .attr( 'type', 'checkbox' )
                .property( 'checked', checkboxStatus )
                .on('click', () => {
                    const isChecked = checkboxLabel.property( 'checked' );
                    customQueryInput.classed( 'hidden', !isChecked );
                    this.queryOptions.classed( 'hidden', !isChecked );

                    if ( isChecked ) {
                        this.submitButton.select( 'span' ).text( 'Next' );
                    } else {
                        this.submitButton.select( 'span' ).text( 'Skip' );
                    }
                });

        const customQueryInput = this.overpassQueryContainer.append( 'textarea' )
            .classed( 'hidden', !checkboxStatus )
            .attr( 'placeholder', defaultValue )
            .property( 'value', overpassQueryValue )
            .on( 'input', () => {
                const value = customQueryInput.node().value;
                let errorText = '';

                if ( !value.includes( 'out:json' ) ) {
                    errorText += '* Query needs to specify "out:json"\n';
                }
                if ( !value.includes( 'out meta' ) ) {
                    errorText += '* Query needs to specify "out meta"\n';
                }

                if ( errorText !== '' && value !== '' ) {
                    errorInfoContainer.text( errorText );
                    this.submitButton.property( 'disabled', true );
                } else {
                    errorInfoContainer.text( '' );
                    this.submitButton.select( 'span' ).text( 'Next' );
                    this.submitButton.property( 'disabled', false );
                }
            });

        this.buildQueryOptions();

        const errorInfoContainer = this.form.select( '.hoot-menu' )
            .insert( 'div', '.modal-footer' )
            .classed( 'badData', true );
    }

    buildQueryOptions() {
        const options = [
            { label: 'Buildings', searchTerm: 'building' },
            { label: 'Highways', searchTerm: 'highway' }
        ];

        this.queryOptions = this.overpassQueryContainer.append( 'div' )
            .classed( 'queryBuilder hidden', true )
            .text( 'Build query options' );

        this.queryOptions.selectAll( 'label' )
            .data( options )
            .enter()
            .append( 'label' )
            .text( data => data.label )
                .append( 'input' )
                .attr( 'type', 'checkbox' )
                .on( 'click', () => {
                    this.queryBuilder();
            } );
    }

    queryBuilder() {
        const checkedInput = this.queryOptions.selectAll( 'input[type=checkbox]:checked' );

        let queryString = '';

        if ( checkedInput.size() !== 0 ) {
            queryString = '[out:json];\n' +
            '(\n';

            checkedInput.each( option => {
                queryString += `nwr["${ option.searchTerm }"]({{bbox}});\n`;
            } );

            // Close out and recurse down
            queryString += ');\n'+
                '(._;>;);\n' +
                'out meta;';
        }

        this.overpassQueryContainer.select( 'textarea' ).property( 'value', queryString );
    }

    handleSubmit() {
        this.form.remove();

        this.formData.overpassQueryContainer = this.overpassQueryContainer;

        if ( this.formData.operationName === 'grailPull' ) {
            new GrailPull( this.formData ).render();
        } else if ( this.formData.operationName.startsWith('createDifferential') ) {
            new DifferentialChangeset( this.formData ).render();
        } else if ( this.formData.operationName === 'taskingManager' ) {
            this.formData.callback();
        }
    }

}
