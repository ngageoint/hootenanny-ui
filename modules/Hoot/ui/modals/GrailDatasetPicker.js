import FormFactory from '../../tools/formFactory';

export default class GrailDatasetPicker {
    constructor( layer, parentId ) {
        this.layer = layer;
        this.parentId = parentId;

    }

    async render() {

        //if layer has no bbox (reflecting filter when pulling data)
        //use the layer mbr extent
        if (!this.layer.bbox) this.layer.bbox = await this.layerExtent( layer.id ).toParams();

        let metadata = {
            title: 'Grail Datasets',
            form: [{
                label: 'Select Reference Dataset',
                id: 'refDataset',
                inputType: 'combobox',
                placeholder: 'Select a dataset',
                data: Hoot.layers.grailReferenceLayers(this.layer),
                readonly: 'readonly',
                sort: false,
                itemKey: 'name',
                _valueKey: 'id'
            }],
            button: {
                text: 'Submit',
                location: 'right',
                id: 'submitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        let formId = 'grailDatasetForm';
        this.form  = new FormFactory().generateForm( 'body', formId, metadata );

    }


    handleSubmit() {

        const params  = {};
        params.input1 = null;
        params.input2 = this.layer.id;
        params.parentId = this.parentId;
        params.BBOX = this.layer.bbox;

        Hoot.api.deriveChangeset( params, true )
            .then( resp => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
