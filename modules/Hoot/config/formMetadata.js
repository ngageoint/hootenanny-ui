/*******************************************************************************************************
 * File: formConfigs.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/15/18
 *******************************************************************************************************/
 
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