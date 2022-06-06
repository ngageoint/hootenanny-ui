import FormFactory from './formFactory';

export default class DifferentialChangeset {
    constructor( instance ) {
        this.instance = instance;
        this.formFactory = new FormFactory();
   }

    async render() {
        let titleMode = 'Create';
        let titleModifier = (this.instance.operationName === 'createDifferentialWithTagsChangeset') ?
            'Diff w/Tags' : 'Differential';
        this.deriveType = [titleModifier, 'changeset'].join(' ');
        let titleExtent = (this.instance.boundsSelectType === 'visualExtent')
            ? 'from Visual Extent'
            : (this.instance.boundsSelectType === 'boundingBox')
                ? 'from Bounding Box'
                : '';
        let titleText = [titleMode, titleModifier, titleExtent].join(' ');

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
        const bounds   = this.instance.bounds,
              data = {};

        if ( !bounds ) {
            Hoot.message.alert( 'Need a bounding box!' );
            return;
        }

        data.bounds = bounds;

        if ( this.instance.overpassQueryContainer.select('input').property('checked') ) {
            data.customQuery = this.instance.overpassQueryContainer.select( 'textarea' ).property( 'value' );
        }

        data.ADV_OPTIONS = this.formFactory.getAdvOpts(this.container, this.advOpts);

        if ( this.instance.boundsSelectType === 'customDataExtent' &&
            sessionStorage.getItem('tm:project') && sessionStorage.getItem('tm:task') ) {
            data.taskInfo = sessionStorage.getItem('tm:project') + ', ' + sessionStorage.getItem('tm:task');
        }

        data.APPLY_TAGS = this.deriveType.includes('w/Tags');

        const params = {
            deriveType : this.deriveType
        };

        Hoot.api.deriveChangeset( data, params )
            .then( ( resp ) => Hoot.message.alert( resp ) );

        this.container.remove();
    }
}
