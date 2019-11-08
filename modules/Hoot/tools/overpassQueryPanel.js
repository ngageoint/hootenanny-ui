import FormFactory          from './formFactory';
import GrailPull            from './grailPull';
import selectBbox           from './selectBbox';
import DifferentialUpload   from './differentialUpload';


export default class OverpassQueryPanel {
    constructor( instance ) {
        this.formData        = instance;
        this.maxFeatureCount = null;
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

        this.buildQueryOptions();

        const errorInfoContainer = this.form.select( '.hoot-menu' )
            .insert( 'div', '.modal-footer' )
            .classed( 'badData', true );
    }

    buildQueryOptions() {
        const options = [ 'Buildings', 'Highways' ];

        this.queryOptions = this.overpassQueryContainer.append( 'div' )
            .classed( 'queryBuilder hidden', true )
            .text( 'Build query options' );

        options.forEach( option => {
            this.queryOptions.append( 'label' )
                .text( option )
                .append( 'input' )
                .attr( 'id', option )
                .attr( 'type', 'checkbox' )
                .on( 'click', () => {
                    this.queryBuilder();
                } );
        } );

    }

    queryBuilder() {
        let queryString = '[out:json][bbox:{{bbox}}];\n' +
            '(\n';

        if ( this.queryOptions.select( '#Buildings' ).property( 'checked' ) ) {
            queryString += 'node["building"]({{bbox}});\n' +
                'way["building"]({{bbox}});\n' +
                'relation["building"]({{bbox}});\n';
        }

        if ( this.queryOptions.select( '#Highways' ).property( 'checked' ) ) {
            queryString += 'node["highway"]({{bbox}});\n' +
                'way["highway"]({{bbox}});\n' +
                'relation["highway"]({{bbox}});\n';
        }

        // Close out and recurse down
        queryString += ');\n'+
            '(._;>;);\n' +
            'out meta;';

        this.overpassQueryContainer.select( 'textarea' ).property( 'value', queryString );
    }

    handleSubmit() {
        this.form.remove();

        this.formData.overpassQueryContainer = this.overpassQueryContainer;

        if ( this.formData.operationName === 'grailPull' ) {
            new GrailPull( this.formData ).render();
        } else if ( this.formData.operationName === 'createDifferentialChangeset' ) {
            new DifferentialUpload( this.formData ).render();
        }
    }

}
