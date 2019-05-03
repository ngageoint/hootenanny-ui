import FormFactory from './formFactory';

import { formatBbox } from './utilities';

export default class DifferentialUpload {
    constructor( instance ) {
        this.instance = instance;
    }

    render() {
        let titleText = this.instance.bboxSelectType === 'visualExtent'
            ? 'Create Differential from Visual Extent'
            : this.instance.bboxSelectType === 'boundingBox'
                ? 'Create Differential from Bounding Box'
                : 'Create Differential';

        let metadata = {
            title: titleText,
            button: {
                text: 'Generate Differential',
                id: 'SubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'differentialTable';

        this.form         = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = this.form.select( `#${ metadata.button.id }` );

        this.submitButton.property( 'disabled', false );

    }

    handleSubmit() {
        const bbox   = this.instance.bbox,
              params = {};

        if ( !bbox ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        params.BBOX       = formatBbox( bbox );

        Hoot.api.createDifferential( params )
            .then( ( resp ) => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
