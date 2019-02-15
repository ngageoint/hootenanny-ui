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
            value: 'root',
            data: this.folderList,
            itemKey: 'path',
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
            data: [ 'Reference', 'Cookie Cutter & Horizontal', 'Differential', 'Differential w/ Tags', 'Attribute' ],
            onChange: () => {
                this.confAdnvOptionsFields = null;
                this.changeAdvancedOptions();
                this.updateAttributeReferenceLayer();
            },
            readonly: 'readonly'
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
            itemKey: 'DESCRIPTION'
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
            itemKey: 'DESCRIPTION'
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
            label: 'Folder Name',
            id: 'addFolderName',
            class: 'new-folder-name',
            inputType: 'text',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Folder Visibility',
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
            label: 'Path',
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
            label: 'Visibility',
            id: 'modifyVisibility',
            inputType: 'checkbox',
            value: 'Public',
            checked: false,
            class: 'folder-checkbox'
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

export function advancedOptions() {
// Road Options -  unify/network engine, Road search radius
// Building Options - these are all good to have access to, tweak as needed
// POI to Poly options - I think some of these were added with planetSense use case in mind, I would keep these exposed as that capability develops and users look to hoot as way of further automating that workflow.
// Railway/Powerlines/Waterways - I disable these since they are on by default to help with processing time but havent done to much conflating with these features types yet but options look very complex
    return [
        // {
        //     name: 'Cleaning Options',
        //     id: 'cleaningOptions',
        //     key: 'map.cleaner.transforms',
        //     members: []
        // },
        {
            label: 'General Options',
            id: 'generalOptions',
            children: [
                {
                    label: 'Add Tag Reviews',
                    id: 'addTagReviews',
                    key: 'add.review.tags.to.features',
                    inputType: 'checkbox',
                    value: 'add',
                    checked: false
                }
            ]
        },
        // {
        //     label: 'Road Options',
        //     id: 'roadOptions',
        //     children: [
        //         {
        //             label: 'Road Search Radius',
        //             id: 'roadSearchRadius',
        //             key: 'search.radius.highway',
        //             inputType: 'text',
        //             value: -1.0,
        //             onChange: () => {
        //                 // update opts value...
        //             }
        //         },
        //         {
        //             label: 'Engines',
        //             inputType: 'combobox',
        //             itemKey: 'display',
        //             valueKey: 'value',
        //             data: [ 'Unify', 'Network' ],
        //             value: 'Network',
        //             children: [
        //                 'matchHighwayClassifier',
        //                 'roadMatchCreator',
        //                 'roadMergerCreator',
        //                 'roadOnlyMergeTags',
        //                 'highwayMatcherHeadingDelta'
        //             ],
        //             onChange: () => {
        //                 // show children? render children?...
        //             }
        //         },
        //         {
        //             label: 'Match Highway Classifier',
        //             id: 'matchHighwayClassifier',
        //             key: 'conflate.match.highway.classifier',
        //             inputType: 'checkbox',
        //             hidden: true,
        //             onChange: () => {
        //                 // add hoot::HighwayRfClassifier
        //             }
        //         },
        //         {
        //             label: 'Match Creator',
        //             id: 'roadMatchCreator',
        //             key: 'match.creator',
        //             inputType: 'checkbox',
        //             value: false,
        //             onChange: () => {
        //                 // add hoot::HighwayMatchCreator
        //             }
        //         },
        //         {
        //             label: 'Merger Creator',
        //             id: 'roadMergerCreator',
        //             key: 'merger.creators',
        //             inputType: 'checkbox',
        //             value: false,
        //             onChange: () => {
        //                 // add hoot::HighwayMergerCreator
        //             }
        //         },
        //         {
        //             label: 'Only Merge Tags',
        //             id: 'roadOnlyMergeTags',
        //             key: 'highway.merge.tags.only',
        //             inputType: 'checkbox',
        //             value: false,
        //             onChange: () => {
        //                 // add key...
        //             }
        //         },
        //         {
        //             label: 'Highway Matcher Heading Delta',
        //             id: 'highwayMatcherHeadingDelta',
        //             value: 5.0,
        //             onChange: () => {
        //                 // update opts value..
        //             }
        //         },
        //         {
        //             label: 'Highway Matcher Heading Delta',
        //             id: 'highwayMatcherMaxAngle',
        //             key: 'highway.matcher.max.angle',
        //             inputType: 'slider',
        //             extrema: [0.0, 360.0],
        //             value: 60.0,
        //             onChange: () => {
        //                 // update delta...
        //             }
        //         },
        //         {
        //             label: 'Highway Max Enum Diff',
        //             id: 'highwayMaxEnumDiff',
        //             key: 'highway.max.enum.diff',
        //             inputType: 'slider',
        //             extrema: [0.01, 1.6],
        //             value: 0.6,
        //             onChange: () => {
        //                 // update enum...
        //             }
        //         }
        //     ]
        // },
        // {
        //     name: 'Building Options',
        //     id: 'buildingOptions'
        // },
        // {
        //     name: 'Point to Polygon Options',
        //     id: 'pointToPolyOptions'
        // },
        // {
        //     name: 'Railway, Power, Waterway Options',
        //     id: 'railPowerWaterOptions'
        // }
    ];
}