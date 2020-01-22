import FormFactory from '../../tools/formFactory';

export default class GrailDatasetPicker {
    constructor( layer, parentId ) {
        this.layer = layer;
        this.parentId = parentId;
        this.formFactory = new FormFactory();

    }

    async render() {

        //if layer has no bbox (reflecting filter when pulling data)
        //use the layer mbr extent
        if (!this.layer.bbox) this.layer.bbox = (await Hoot.layers.layerExtent( this.layer.id )).toParam();

        let data = Hoot.layers.grailReferenceLayers(this.layer);
        let metadata;
        if (data.length) {
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
                    onChange: d => this.updateSubmitButton( )
                }],
                button: {
                    text: 'Submit',
                    id: 'SubmitBtn',
                    onClick: () => this.handleSubmit()
                }
            };

            //Add advanced options to form
            this.advOpts = await Hoot.api.getAdvancedChangesetOptions();
            metadata.form = metadata.form.concat(this.advOpts.map(this.formFactory.advOpt2DomMeta));

        } else {
            metadata = {
                title: 'No Suitable Grail Reference Datasets'
            };



        }
        let formId = 'grailDatasetForm';
        this.form  = this.formFactory.generateForm( 'body', formId, metadata );

        // this.formFactory.createToggle(this.form);
        this.submitButton = d3.select( `#${ metadata.button.id }` );
        this.updateSubmitButton();
    }

    updateSubmitButton() {
        this.submitButton.attr( 'disabled', function() {
                var n = d3.select('#refDataset').property('value');
                return (n && n.length) ? null : true;
            });
    }

    handleSubmit(d) {
        let target = d3.select('#refDataset'),
            refId  = parseInt(target.attr( '_value' ), 10);

        const params  = {};
        params.input1 = refId;
        params.input2 = this.layer.id;
        params.parentId = this.parentId;
        params.BBOX = this.layer.bbox;
        params.ADV_OPTIONS = this.formFactory.getAdvOpts(this.form, this.advOpts);

        Hoot.api.deriveChangeset( params, true )
            .then( resp => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
