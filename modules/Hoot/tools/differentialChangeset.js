import FormFactory from './formFactory';

import { formatBbox } from './utilities';

export default class DifferentialChangeset {
    constructor( instance ) {
        this.instance = instance;
        this.formFactory    = new FormFactory();
   }

    async render() {
        let titleText = this.instance.bboxSelectType === 'visualExtent'
            ? 'Create Differential from Visual Extent'
            : this.instance.bboxSelectType === 'boundingBox'
                ? 'Create Differential from Bounding Box'
                : 'Create Differential';

        this.advOpts = await Hoot.api.getAdvancedOptions('differential');
        let advForm = this.advOpts.map(this.formFactory.advOpt2DomMeta);

        let metadata = {
            title: titleText,
            form: advForm,
            button: {
                text: 'Generate Differential',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'differentialTable';

        this.container         = this.formFactory.generateForm( 'body', formId, metadata );
        this.submitButton = this.container.select( `#${ metadata.button.id }` );

        this.submitButton.property( 'disabled', false );

    }

    /**
     * Compares state of
     * advanced options to defaults and
     * adds to params if different
     */
    getAdvOpts() {
        let that = this;
        let advParams = {};

        this.advOpts.forEach(function(d) {
            let propName;
            switch (d.input) {
                case 'checkbox':
                    propName = 'checked';
                    break;
                case 'text':
                default:
                    propName = 'value';
                    break;
            }
            let inputValue = that.container.select('#' + d.id).property(propName).toString();

            // Need .length check because empty text box should be considered equal to default
            if ( inputValue.length && inputValue !== d.default ) {
                advParams[d.id] = inputValue;
            }
        });

        return advParams;
    }

    handleSubmit() {
        const bbox   = this.instance.bbox,
              params = {};

        if ( !bbox ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        params.BBOX = formatBbox( bbox );

        if ( this.instance.overpassQueryContainer.select('input').property('checked') ) {
            params.customQuery = this.instance.overpassQueryContainer.select( 'textarea' ).property( 'value' );
        }

        params.ADV_OPTS = this.getAdvOpts();

        Hoot.api.createDifferentialChangeset( params )
            .then( ( resp ) => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
