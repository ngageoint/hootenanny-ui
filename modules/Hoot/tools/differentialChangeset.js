import FormFactory from './formFactory';

import { formatBbox } from './utilities';

export default class DifferentialChangeset {
    constructor( instance ) {
        this.instance = instance;
        this.formFactory = new FormFactory();
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

        this.formFactory.createToggle(this.container);

    }

    handleSubmit() {
        const bbox   = this.instance.bbox,
              data = {},
              params = {};

        if ( !bbox ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        if (sessionStorage.getItem('tm:project') && sessionStorage.getItem('tm:task')) {
            params.taskInfo = sessionStorage.getItem('tm:project') + ', ' + sessionStorage.getItem('tm:task');
        }

        data.BBOX = formatBbox( bbox );

        if ( this.instance.overpassQueryContainer.select('input').property('checked') ) {
            data.customQuery = this.instance.overpassQueryContainer.select( 'textarea' ).property( 'value' );
        }

        data.ADV_OPTIONS = this.formFactory.getAdvOpts(this.container, this.advOpts);

        Hoot.api.createDifferentialChangeset( data, params )
            .then( ( resp ) => Hoot.message.alert( resp ) );

        this.container.remove();
    }
}
