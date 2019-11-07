import FormFactory from '../../tools/formFactory';

export default class GrailDatasetPicker {
    constructor( layer, parentId ) {
        this.layer = layer;
        this.parentId = parentId;

    }

    async render() {

        //if layer has no bbox (reflecting filter when pulling data)
        //use the layer mbr extent
        if (!this.layer.bbox) this.layer.bbox = (await Hoot.layers.layerExtent( this.layer.id )).toParam();

        let data = Hoot.layers.grailReferenceLayers(this.layer);
        let metadata;
        if (data .length) {
            metadata = {
                title: 'Grail Datasets',
                form: [{
                    label: 'Select Reference Dataset',
                    id: 'refDataset',
                    inputType: 'combobox',
                    placeholder: 'Select a dataset',
                    data: data,
                    readonly: 'readonly',
                    sort: false,
                    itemKey: 'name',
                    _value: this.layer.id,
                    _valueKey: 'id',
                    onChange: d => this.handleSubmit( d )
                }]
            };
        } else {
            metadata = {
                title: 'No Suitable Grail Reference Datasets'
            };

        }
        let formId = 'grailDatasetForm';
        this.form  = new FormFactory().generateForm( 'body', formId, metadata );

    }


    handleSubmit(d) {
        let target = d3.select( `#${ d.id }` ),
            refId  = parseInt(target.attr( '_value' ), 10);

        const params  = {};
        params.input1 = refId;
        params.input2 = this.layer.id;
        params.parentId = this.parentId;
        params.BBOX = this.layer.bbox;

        Hoot.api.deriveChangeset( params, true )
            .then( resp => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
