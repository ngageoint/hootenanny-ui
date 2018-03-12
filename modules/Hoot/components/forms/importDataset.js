/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import FolderManager from '../../models/folderManager';
import FormFactory from './formFactory';
import { importDatasetTypes } from '../../config/domElements';

export default function ImportDataset( translations ) {
    this.folderList   = FolderManager.availFolders;
    this.importTypes  = importDatasetTypes;
    this.translations = translations;

    this.form = [
        {
            label: 'Import Type',
            id: 'importDatasetImportType',
            placeholder: 'Select Import Type',
            inputType: 'combobox',
            combobox: {
                data: this.importTypes,
                command: this.populateImportTypes
            }
        },
        {
            label: 'Import Data',
            id: 'importDatasetFileImport',
            placeholder: 'Select File',
            icon: 'folder',
            readOnly: true,
            inputType: 'multipart',
            multipartId: 'ingestFileUploader'
        },
        {
            label: 'Layer Name',
            id: 'importDatasetLayerName',
            placeholder: 'Enter name'
        },
        {
            label: 'Path',
            placeholder: 'root',
            id: 'importDatasetPathName',
            inputType: 'combobox',
            combobox: {
                data: this.folderList
            }
        },
        {
            label: 'Enter Name for New Folder (Leave blank otherwise)',
            id: 'importDatasetNewFolderName'
        },
        {
            label: 'Translation Schema of Import File',
            placeholder: 'Select Data Translation Schema',
            id: 'importDatasetSchema',
            inputType: 'combobox',
            combobox: {
                data: translations
            }
        }
    ];

    this.render = () => {
        let button = {
            text: 'Import',
            location: 'right',
            id: 'importDatasetBtnContainer'
        };

        let metadata = {
            title: 'Import Dataset',
            form: this.form,
            button
        };

        new FormFactory().generateForm( 'body', metadata );
    };

    this.populateImportTypes = function() {

    };
}