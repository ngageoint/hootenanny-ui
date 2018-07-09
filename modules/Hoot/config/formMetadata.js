/*******************************************************************************************************
 * File: formConfigs.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/15/18
 *******************************************************************************************************/

export const sidebarForms = [
    {
        type: 'add',
        refType: 'primary',
        id: 'primary',
        class: 'layer-add',
        tableId: 'add-ref-table',
        color: 'violet',
        toggleButtonText: 'Add Reference Dataset'
    },
    {
        type: 'add',
        refType: 'secondary',
        id: 'secondary',
        class: 'layer-add',
        tableId: 'add-secondary-table',
        color: 'orange',
        toggleButtonText: 'Add Secondary Dataset'
    },
    {
        type: 'conflate',
        id: 'conflate',
        class: 'layer-conflate',
        toggleButtonText: 'Conflate'
    },
    {
        type: 'review',
        id: 'review',
        class: 'layer-review',
        toggleButtonText: 'Complete Review'
    }
];

export function layerConflateForm( data ) {
    return [
        {
            label: 'Save As',
            id: 'conflateSaveAs',
            inputType: 'text',
            value: this.getSaveName( data ),
            validate: true,
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Path',
            id: 'conflateFolderPath',
            inputType: 'combobox',
            value: 'root',
            data: this.folderList,
            itemKey: 'path',
            sort: true,
            readonly: 'readonly'
        },
        {
            label: 'New Folder Name (leave blank otherwise)',
            id: 'conflateNewFolderName',
            inputType: 'text',
            type: 'newfoldername',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Type',
            id: 'conflateType',
            inputType: 'combobox',
            value: 'Reference',
            data: [ 'Reference', 'Average', 'Cookie Cutter & Horizontal', 'Differential' ],
            onchange: () => {
                this.confAdnvOptionsFields = null;
                this.removeAdvancedOptionsDlg();
            },
            readonly: 'readonly'
        },
        {
            label: 'Attribute Reference Layer',
            id: 'conflateRefLayer',
            inputType: 'combobox',
            value: this.layers.primary.name,
            data: Object.values( this.layers ).map( layer => layer.name ),
            readonly: 'readonly'
        },
        {
            label: 'Collect Statistics?',
            id: 'conflateCollectStats',
            inputType: 'combobox',
            value: 'false',
            data: [ 'true', 'false' ],
            onchange: function() {
                var selVal = d3.selectAll( '.reset.isCollectStats' ).value();
            },
            readonly: 'readonly'
        },
        {
            label: 'Generate Report?',
            id: 'conflateGenerateReport',
            inputType: 'combobox',
            value: 'false',
            data: [ 'true', 'false' ],
            onchange: function() {
                var selVal = d3.selectAll( '.reset.isGenerateReport' ).value();
                return selVal;
            },
            readonly: 'readonly',
            testmode: true
        }
    ];
}

export function importDatasetForm() {
    return [
        {
            label: 'Import Type',
            id: 'importDatasetImportType',
            inputType: 'combobox',
            placeholder: 'Select Import Type',
            data: this.importTypes,
            itemKey: 'title',
            onChange: () => this.handleTypeChange()
        },
        {
            label: 'Import Data',
            id: 'importDatasetFileImport',
            inputType: 'multipart',
            placeholder: 'Select File',
            icon: 'folder',
            readOnly: true,
            disabled: true,
            multipartId: 'ingestFileUploader',
            onChange: () => this.handleMultipartChange()
        },
        {
            label: 'Layer Name',
            id: 'importDatasetLayerName',
            inputType: 'text',
            placeholder: 'Enter name',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Path',
            id: 'importDatasetPathName',
            inputType: 'combobox',
            placeholder: 'root',
            data: this.folderList,
            sort: true,
            itemKey: 'path'
        },
        {
            label: 'Enter Name for New Folder (Leave blank otherwise)',
            id: 'importDatasetNewFolderName',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Translation Schema of Import File',
            id: 'importDatasetSchema',
            inputType: 'combobox',
            placeholder: 'Select Data Translation Schema',
            disabled: true,
            data: this.translations,
            itemKey: 'DESCRIPTION'
        }
    ];
}

export function translationAddForm() {
    return [
        {
            label: 'Name',
            id: 'translationSaveName',
            inputType: 'text',
            onChange: d => this.validateFields( d )
        },
        {
            label: 'Description',
            id: 'translationSaveDescription',
            inputType: 'text',
            onChange: d => this.validateFields( d )
        },
        {
            label: 'Paste New Translation in Box (or drag .js file into text area)',
            id: 'translationTemplate',
            inputType: 'textarea',
            data: this.templateText || null,
            onChange: d => this.validateFields( d ),
            onDrop: () => this.handleFileDrop()
        }
    ];
}

export function basemapAddForm() {
    return [
        {
            label: 'Raster File',
            id: 'basemapFileImport',
            inputType: 'multipart',
            placeholder: 'Select File',
            icon: 'folder',
            readOnly: true,
            multipartId: 'ingestFileUploader',
            accept: '.shp, .shx, .dbf, .prj, .osm, .zip',
            onChange: () => this.handleMultipartChange()
        },
        {
            label: 'Name',
            id: 'basemapName',
            inputType: 'text',
            placeholder: 'Enter name',
            onChange: d => this.validateTextInput( d )
        }
    ];
}