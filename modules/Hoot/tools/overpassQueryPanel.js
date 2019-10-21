import FormFactory from './formFactory';
import GrailPull   from './grailPull';
import selectBbox  from './selectBbox';

export default class OverpassQueryPanel {
    constructor( instance ) {
        this.formData        = instance;
        this.maxFeatureCount = null;
    }

    render() {
        const titleText = 'Enter Custom Query or Skip to Use Default';

        let metadata = {
            title: titleText,
            button: {
                text: 'Skip',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'overpassTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3.select( `#${ metadata.button.id }` );

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

                const grailSelectBbox = new selectBbox( this.formData.context, this.formData );
                grailSelectBbox.render( this.formData.operationName );
            } );

        backButton.append( 'span' )
            .text( 'Back' );
    }

    overpassQueryPanel() {
        this.submitButton.select( 'span' ).text( 'Skip' );

        // construct input section for user custom overpass queries
        this.overpassQueryContainer = this.form
            .select( '.wrapper div' )
            .insert( 'div', '.modal-footer' )
            .classed( 'button-wrap user-input', true );

        let overpassQueryValue = '',
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
                .attr( 'type', 'checkbox' )
                .property( 'checked', checkboxStatus )
                .on('click', function() {
                    const isChecked = d3.select( this ).property( 'checked' );
                    customQueryInput.classed( 'hidden', !isChecked );
                });

        const placeholder = '[out:json][bbox:{{bbox}}];\n' +
            '(\n' +
            '   node;<;>;\n' +
            ');\n' +
            'out meta;';

        const customQueryInput = this.overpassQueryContainer.append( 'textarea' )
            .classed( 'hidden', !checkboxStatus )
            .attr( 'placeholder', placeholder )
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

        const errorInfoContainer = this.form.select( '.hoot-menu' )
            .insert( 'div', '.modal-footer' )
            .classed( 'badData', true );
    }

    handleSubmit() {
        this.form.remove();

        this.formData.overpassQueryContainer = this.overpassQueryContainer;

        new GrailPull( this.formData ).render();
    }

}
