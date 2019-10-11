import FormFactory from './formFactory';
import GrailPull   from './grailPull';

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

        this.submitButton.property( 'disabled', false );

        this.overpassQueryPanel();
    }

    overpassQueryPanel() {
        this.submitButton.select( 'span' ).text( 'Skip' );

        // construct input section for user custom overpass queries
        this.overpassQueryContainer = this.form
            .select( '.wrapper div' )
            .insert( 'div', '.modal-footer' )
            .classed( 'button-wrap user-input', true );

        this.overpassQueryContainer.append( 'input' )
            .attr( 'type', 'checkbox' )
            .on('click', function() {
                const isChecked = d3.select( this ).property( 'checked' );
                customQueryInput.classed( 'hidden', !isChecked );
            });

        this.overpassQueryContainer.append('div').text('Custom Overpass query');

        const placeholder = '[out:json][bbox:{{bbox}}];\n' +
            '(\n' +
            '   node;<;>;\n' +
            ');\n' +
            'out meta;';

        const customQueryInput = this.overpassQueryContainer.append( 'textarea' )
            .classed( 'hidden', true )
            .attr( 'placeholder', placeholder )
            .on( 'input', () => {
                const value = customQueryInput.node().value;
                let errorText = '';

                if ( !value.includes( 'out:json' ) ) {
                    errorText += '* Query needs to specify "out:json"\n';
                }
                if ( !value.includes( 'out meta' ) ) {
                    errorText += '* Query needs to specify "out meta"\n';
                }

                errorInfoContainer.text( errorText );
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
