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
                text: 'Submit',
                id: 'SubmitBtn',
                disabled: null,
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'differentialTable';

        this.container = this.formFactory.generateForm( 'body', formId, metadata );

        this.createToggle();

    }

    createToggle() {
        let iconText = 'arrow_right';
        let fldset = this.container.selectAll('fieldset');
        fldset.classed('hidden', true);
        let toggle = this.container
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
        let text = toggle.append('span')
            .text( 'Advanced Options' );
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
