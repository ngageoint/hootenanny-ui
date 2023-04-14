import FormFactory from '../../tools/formFactory';
import { select as d3_select } from 'd3-selection';

export default class GrailDatasetPicker {
    constructor( layer, parentId, params ) {
        this.layer = layer;
        this.parentId = parentId;
        this.params = params;
        this.formFactory = new FormFactory();

    }

    async render() {

        //if layer has no bounds (reflecting filter when pulling data)
        //use the layer mbr extent
        if (!this.layer.bounds) this.layer.bounds = (await Hoot.layers.layerExtent( this.layer.id )).toParam();

        this.refDatasets = Hoot.layers.grailReferenceLayers(this.layer);
        let metadata;
        if (this.refDatasets.length) {
            const referenceComboboxMeta = {
                label: 'Select Reference Dataset',
                id: 'refDataset',
                inputType: 'combobox',
                placeholder: 'Select a dataset',
                data: this.refDatasets,
                readonly: 'readonly',
                sort: false,
                itemKey: 'name',
                _valueKey: 'id',
                onChange: () => this.updateSubmitButton( )
            };
            this.checkForReference( referenceComboboxMeta );

            metadata = {
                title: 'Grail Datasets',
                form: [ referenceComboboxMeta ],
                button: {
                    text: 'Submit',
                    id: 'SubmitBtn',
                    onClick: () => this.handleSubmit()
                }
            };

            //Add advanced options to form
            this.advOpts = await Hoot.api.getAdvancedChangesetOptions();
            if ( this.advOpts ) {
                metadata.form = metadata.form.concat(this.advOpts.map(this.formFactory.advOpt2DomMeta));
            }

        } else {
            metadata = {
                title: 'No Suitable Grail Reference Datasets'
            };
        }
        let formId = 'grailDatasetForm';
        this.form  = this.formFactory.generateForm( 'body', formId, metadata );

        if (this.refDatasets.length) {
            this.submitButton = d3_select( `#${ metadata.button.id }` );
            this.updateSubmitButton();
        }
    }

    checkForReference( metadataObj ) {
        let secondaryDataset = '';
        const layerHash = this.layer.name.split('_');
        const matchHash = layerHash.length > 0 ? layerHash[ layerHash.length - 1 ] : '';

        if ( matchHash ) {
            this.refDatasets.forEach( refData => {
                if ( refData.name.endsWith( matchHash ) ) {
                    metadataObj.value = refData.name;
                    metadataObj._value = refData.id;
                }
            } );
        }

        return secondaryDataset;
    }

    updateSubmitButton() {
        this.submitButton.attr( 'disabled', function() {
                var n = d3_select('#refDataset').property('value');
                return (n && n.length) ? null : true;
            });
    }

    handleSubmit() {
        let target = d3_select('#refDataset'),
            refId  = parseInt(target.attr( '_value' ), 10);

        if ( isNaN(refId) ) {
            return;
        }

        const data  = {};
        data.input1 = refId;
        data.input2 = this.layer.id;
        data.parentId = this.parentId;
        data.bounds = this.layer.bounds;
        data.ADV_OPTIONS = this.formFactory.getAdvOpts(this.form, this.advOpts);
        data.taskInfo = this.params.taskInfo;

        this.params.replacement = true;

        Hoot.api.deriveChangeset( data, this.params )
            .then( resp => Hoot.message.alert( resp ) );

        this.form.remove();
    }
}
