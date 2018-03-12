/** ****************************************************************************************************
 * File: importDatasets
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/12/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import FolderManager from '../../models/folderManager';
import FormFactory from './formFactory';
import { importDatasetTypes } from '../../config/domElements';
import { d3combobox as d3_combobox } from '../../../lib/d3.combobox';

export default function ImportDataset( translations ) {
    this.folderList   = FolderManager.availableFolders;
    this.importTypes  = importDatasetTypes;
    this.translations = translations;

    console.log( this.folderList );

    this.render = () => {
        let form = [
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
                    data: this.folderList,
                    command: this.populateFolderList
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
                    data: this.translations,
                    command: this.populateTranslations
                }
            }
        ];

        let button = {
            text: 'Import',
            location: 'right',
            id: 'importDatasetBtnContainer'
        };

        let metadata = {
            title: 'Import Dataset',
            form: form,
            button
        };

        new FormFactory().generateForm( 'body', metadata );
    };

    this.populateImportTypes = function( d ) {
        let combobox = d3_combobox()
            .data( _.map( d.combobox.data, n => {
                return {
                    value: n.title,
                    title: n.title
                };
            } ) );

        d3.select( this )
            .call( combobox );
    };

    this.populateFolderList = function( d ) {
        let combobox = d3_combobox()
            .data( _.map( d.combobox.data, n => {
                return {
                    value: n.path,
                    title: n.path
                };
            } ) );

        d3.select( this )
            .call( combobox );
    };

    this.populateTranslations = function( d ) {
        let combobox = d3_combobox()
            .data( _.map( d.combobox.data, n => {
                return {
                    value: n.DESCRIPTION,
                    title: n.DESCRIPTION
                }
            } ) );

        d3.select( this )
            .call( combobox );
    };
}