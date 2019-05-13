import AdvancedOpts from '../ui/sidebar/advancedOpts';

import _cloneDeep from 'lodash-es/cloneDeep';
import _isEmpty from 'lodash-es/isEmpty';
import _isEqual from 'lodash-es/isEqual';
import hoot from '../hoot';

/*******************************************************************************************************
 * File: formConfigs.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/15/18
 *******************************************************************************************************/

export function layerConflateForm( data ) {
    return [
        {
            label: 'Save As',
            id: 'conflateSaveAs',
            class: 'layer-name',
            inputType: 'text',
            value: this.getSaveName( data ),
            validate: true,
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Path',
            id: 'conflateFolderPath',
            class: 'path-name',
            inputType: 'combobox',
            value: this.defaultFolder ? this.defaultFolder.name : 'root',
            _value: this.defaultFolder ? this.defaultFolder.id : 0,
            data: this.folderList,
            itemKey: 'path',
            _valueKey: 'id',
            sort: true,
            readonly: 'readonly'
        },
        {
            label: 'New Folder Name (leave blank otherwise)',
            id: 'conflateNewFolderName',
            class: 'new-folder-name',
            inputType: 'text',
            type: 'newfoldername',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Type',
            id: 'conflateType',
            inputType: 'combobox',
            value: 'Reference',
            data: this.conflateTypes,
            readonly: 'readonly',
            onChange: function(d) {
                // update the renderd default value to match those in the conflation configs...
                let type = d3.select( '#conflateType' ).property( 'value' );
                let advancedOpts = AdvancedOpts.getInstance();
                let advOpts = _cloneDeep( advancedOpts.advancedOptions );
                if ( !_isEmpty(advancedOpts.conflationOptions[type.toLowerCase()]) ) {
                    let typeDefaults = advancedOpts.conflationOptions[type.toLowerCase()];
                    advOpts = advOpts.map(function(opt) {
                        if (opt.name === type) {
                            opt.members = opt.members.map(function(member) {
                                if (typeDefaults[member.id]) {
                                    member.default = typeDefaults[member.id];
                                }
                                return member;
                            });
                        }
                        return opt;
                    });

                }

                if (!_isEqual(advOpts, advancedOpts.advancedOptions)) {
                    advancedOpts.createGroups(advOpts);
                } else {
                    // disable & enable the attribute conflation group.
                    let attributeGroup = d3.select( '.advanced-opts-content #Attribute_group' ),
                        isAttribute = d3.select( '#conflateType' ).property( 'value' ) === 'Attribute';

                    attributeGroup.select( '.adv-opt-title' )
                        .classed( 'adv-opt-title-disabled', !isAttribute );

                    attributeGroup.select( '.adv-opt-toggle' )
                        .classed( 'toggle-disabled', !isAttribute );

                    attributeGroup
                        .select( '.group-body', true );
                }
            }
        },
        {
            label: 'Attribute Reference Layer',
            id: 'conflateRefLayer',
            inputType: 'combobox',
            value: this.selectedLayers.primary.name,
            data: Object.values( this.selectedLayers ).map( layer => layer.name ),

            readonly: 'readonly'
        },
        {
            label: 'Collect Statistics?',
            id: 'conflateCollectStats',
            inputType: 'combobox',
            value: 'false',
            data: [ 'true', 'false' ],
            onchange: function() {
                // var selVal = d3.selectAll( '.reset.isCollectStats' ).value();
            },
            readonly: 'readonly'
        }
    ];
}

export function importSingleForm() {
    return [
        {
            label: 'Import Type',
            id: 'importType',
            inputType: 'combobox',
            placeholder: 'Select Import Type',
            itemKey: 'title',
            onChange: () => this.handleTypeChange()
        },
        {
            label: 'Import Data',
            id: 'importFile',
            class: 'multipart-input',
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
            id: 'importLayerName',
            class: 'layer-name',
            inputType: 'text',
            placeholder: 'Enter name',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Path',
            id: 'importPathName',
            class: 'path-name',
            inputType: 'combobox',
            placeholder: 'root',
            data: this.folderList,
            sort: true,
            itemKey: 'path'
        },
        {
            label: 'Enter Name for New Folder (Leave blank otherwise)',
            id: 'importNewFolderName',
            class: 'new-folder-name',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Translations Schema of Import File',
            id: 'importSchema',
            inputType: 'combobox',
            placeholder: 'Select Data Translations Schema',
            disabled: true,
            data: this.translations,
            itemKey: 'NAME'
        }
    ];
}

export function importMultiForm() {
    return [
        {
            label: 'Import Type',
            id: 'importType',
            inputType: 'combobox',
            placeholder: 'Select Import Type',
            itemKey: 'title',
            onChange: () => this.handleTypeChange()
        },
        {
            label: 'Import Data',
            id: 'importFile',
            class: 'multipart-input',
            inputType: 'multipart',
            placeholder: 'Select Files',
            icon: 'folder',
            readOnly: true,
            disabled: true,
            multipartId: 'ingestFileUploader',
            onChange: () => this.handleMultipartChange()
        },
        {
            label: 'Import Files List',
            id: 'importFileList',
            inputType: 'listbox',
            readOnly: true
        },
        {
            label: 'Path',
            id: 'importPathName',
            class: 'path-name',
            inputType: 'combobox',
            placeholder: 'root',
            data: this.folderList,
            sort: true,
            itemKey: 'path'
        },
        {
            label: 'Enter Name for New Folder (Leave blank otherwise)',
            id: 'importNewFolderName',
            class: 'new-folder-name',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Translations Schema of Import File',
            id: 'importSchema',
            inputType: 'combobox',
            placeholder: 'Select Data Translations Schema',
            disabled: true,
            data: this.translations,
            itemKey: 'NAME'
        },
        {
            label: 'Append FCODE Descriptions',
            type: 'appendFCodeDescription',
            inputType: 'checkbox',
            checkbox: 'cboxAppendFCode',
            hidden: true
        },
        {
            label: 'Custom Suffix',
            id: 'importCustomSuffix',
            onChange: d => this.validateTextInput( d )
        }
    ];
}

export function addFolderForm() {
    return [
        {
            label: 'Name',
            id: 'addFolderName',
            class: 'new-folder-name',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Public',
            id: 'addFolderVisibility',
            inputType: 'checkbox',
            value: 'Public',
            checked: false,
            class: 'folder-checkbox'
        }
    ];
}

export function modifyDatasetForm() {
    return [
        {
            label: 'Name',
            id: 'modifyName',
            class: 'layer-name',
            inputType: 'text',
            placeholder: 'Enter name',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Move to Existing Folder',
            id: 'modifyPathName',
            class: 'path-name',
            inputType: 'combobox',
            placeholder: 'root',
            data: this.folderList,
            readonly: 'readonly',
            sort: true,
            itemKey: 'path'
        },
        {
            label: 'Move to New Folder (Leave blank otherwise)',
            id: 'modifyNewFolderName',
            class: 'new-folder-name',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Public',
            id: 'modifyVisibility',
            inputType: 'checkbox',
            value: 'Public',
            checked: false,
            class: 'folder-checkbox'
        }
    ];
}

export function exportDataForm( zipOutput ) {
    const exportComboId = 'exportTranslationCombo',
          exportFormatId = 'exportFormatCombo',
          exportNameId = 'dataExportNameTextInput',
          exportFgdbId = 'exportAppendFgdb';

    let meta = [
        {
            label: 'Translation Schema',
            id: exportComboId,
            inputType: 'combobox',
            readonly: 'readonly',
            data: this.translations.map(t => t.NAME),
            value: 'OSM',
            onChange: () => this.validate( exportComboId )
        },
        {
            label: 'Export Format',
            id: exportFormatId,
            inputType: 'combobox',
            data: [ 'File Geodatabase', 'Shapefile', 'OpenStreetMap (OSM)', 'OpenStreetMap (PBF)' ],
            value: 'OpenStreetMap (OSM)',
            onChange: () => {
                const isFgdb = d3.select( `#${exportFormatId}` ).property( 'value' ) === 'File Geodatabase';


                d3.select( `#${exportFgdbId}_container` )
                    .classed( 'hidden', !isFgdb );

                this.validate( exportFormatId );
            }
        },
        {
            label: 'ESRI FGDB Template',
            id: exportFgdbId,
            class: 'hidden',
            inputType: 'checkbox',
            value: 'append',
            checked: false,
            hidden: true
        },
        // {
        //     label: 'Tag Overrides',
        //     id: 'exportTagOverrideId',
        //     inputType: 'custom'
        // },
    ];

    if ( zipOutput ) {
        meta.push({
            label: 'Output Zip Name',
            id: exportNameId,
            inputType: 'text',
            onChange: () => this.validate( exportNameId )
        });
    }

    return meta;
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
            label: 'Paste New Translations in Box (or drag .js file into text area)',
            id: 'translationTemplate',
            inputType: 'textarea',
            data: this.templateText || null,
            onChange: d => this.validateFields( d ),
            onDrop: () => this.handleFileDrop()
        }
    ];
}

export function translationViewForm() {
    return [
        {
            label: 'Description',
            id: 'translationSaveDescription',
            inputType: 'text',
            onChange: d => this.validateFields( d )
        },
        {
            label: 'Paste New Translations in Box (or drag .js file into text area)',
            id: 'translationTemplate',
            inputType: 'textarea',
            data: this.templateText || null,
            onChange: d => this.validateFields( d )
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

export function aboutForm() {
    return [
        {
            label: 'Main Version',
            id: 'aboutMainVersion',
            inputType: 'custom',
            createCustom: field => this.createTableFieldset( field )
        }
    ];
}

export function conflictActions() {
    return [
        {
            id: 'bookmark_review',
            name: 'share_review',
            text: 'Bookmark Review',
            class: '_icon plus fill-grey button round pad0y pad1x small strong',
            cmd: this.cmd( 'Ctrl+b' ),
            action: () => this.resolve.publishBookmark()
        },
        {
            id: 'toggle_table',
            name: 'toggle_table',
            text: 'Hide Table',
            class: 'fill-grey button round pad1x small strong toggle_table',
            cmd: this.cmd( 't' ),
            action: () => this.info.toggleTable()
        },
        {
            id: 'merge',
            name: 'auto_merge',
            text: 'Merge',
            color: '',
            class: '_icon plus merge pad1x small strong',
            cmd: this.cmd( 'm' ),
            action: () => this.merge.mergeFeatures()
        },
        {
            id: 'previous',
            name: 'review_backward',
            text: 'Previous',
            class: 'fill-grey button round pad1x small strong',
            cmd: this.cmd( 'p' ),
            action: () => this.traverse.traverseBackward()
        },
        {
            id: 'next',
            name: 'review_foward',
            text: 'Next',
            class: 'fill-grey button round pad1x small strong',
            cmd: this.cmd( 'n' ),
            action: () => this.traverse.traverseForward()
        },
        {
            id: 'resolved',
            text: 'Resolved',
            class: '_icon check primary pad1x',
            cmd: this.cmd( 'r' ),
            action: () => this.resolve.retainFeature()
        }
    ];
}
