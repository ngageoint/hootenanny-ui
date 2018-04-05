/*******************************************************************************************************
 * File: formConfigs.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/15/18
 *******************************************************************************************************/

export const sidebarForms = [
    {
        color: 'violet',
        toggleButtonText: 'Add Reference Dataset',
        id: 'add-ref',
        tableId: 'add-ref-table'
    },
    {
        color: 'orange',
        toggleButtonText: 'Add Secondary Dataset',
        id: 'add-secondary',
        tableId: 'add-secondary-table'
    }
];

export function layerConflateForm() {
    return [
        {
            label: 'Save As',
            type: 'saveAs',
            //placeholder: _newName
        },
        {
            label: 'Path',
            type: 'pathname',
            placeholder: 'root',
            //combobox: { 'data': folderList, 'command': _populateFolderListCombo },
            readonly: 'readonly'
        },
        {
            label: 'New Folder Name (leave blank otherwise)',
            type: 'newfoldername',
            placeholder: ''
        },
        {
            label: 'Type',
            type: 'ConfType',
            placeholder: 'Reference',
            combobox: {
                'data': [ 'Reference', 'Average', 'Cookie Cutter & Horizontal', 'Differential' ],
                //'command': _populateReferenceCombo
            },
            onchange: function() {
                //_instance.confAdvOptionsFields = null;
                //_removeAdvancedOptionsDlg();
            },
            readonly: 'readonly'
        },
        {
            label: 'Attribute Reference Layer',
            type: 'referenceLayer',
            //placeholder: primaryLayerName,
            //combobox: refLayers,
            readonly: 'readonly'
        },
        {
            label: 'Collect Statistics?',
            type: 'isCollectStats',
            placeholder: 'false',
            combobox: [ 'true', 'false' ],
            onchange: function() {
                var selVal = d3.selectAll( '.reset.isCollectStats' ).value();
            },
            readonly: 'readonly'
        },
        {
            label: 'Generate Report?',
            type: 'isGenerateReport',
            placeholder: 'false',
            combobox: [ 'true', 'false' ],
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
            placeholder: 'Select Import Type',
            inputType: 'combobox',
            combobox: {
                data: this.importTypes,
                command: this.populateImportTypes
            },
            onChange: () => this.handleTypeChange()
        },
        {
            label: 'Import Data',
            id: 'importDatasetFileImport',
            placeholder: 'Select File',
            icon: 'folder',
            readOnly: true,
            disabled: true,
            inputType: 'multipart',
            multipartId: 'ingestFileUploader',
            onChange: () => this.handleMultipartChange()
        },
        {
            label: 'Layer Name',
            id: 'importDatasetLayerName',
            placeholder: 'Enter name',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Path',
            placeholder: 'root',
            id: 'importDatasetPathName',
            inputType: 'combobox',
            combobox: {
                data: this.folderList,
                command: this.populateFolderList
            }
        },
        {
            label: 'Enter Name for New Folder (Leave blank otherwise)',
            id: 'importDatasetNewFolderName',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Translation Schema of Import File',
            placeholder: 'Select Data Translation Schema',
            id: 'importDatasetSchema',
            inputType: 'combobox',
            disabled: true,
            combobox: {
                data: this.translations,
                command: this.populateTranslations
            }
        }
    ];
}