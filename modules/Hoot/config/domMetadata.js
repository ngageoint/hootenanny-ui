import AdvancedOpts from '../ui/sidebar/advancedOpts';

import _cloneDeep from 'lodash-es/cloneDeep';
import _isEmpty from 'lodash-es/isEmpty';
import _isEqual from 'lodash-es/isEqual';

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
            value: (this.defaultFolder) ? this.defaultFolder.path : '/',
            _value: (this.defaultFolder) ? this.defaultFolder.id : 0,
            data: this.folderList,
            itemKey: 'path',
            _valueKey: 'id',
            sort: true,
            readonly: 'readonly'
        },
        {
            label: 'Type',
            id: 'conflateType',
            inputType: 'combobox',
            value: 'Reference',
            data: this.conflateTypes,
            readonly: 'readonly',
            onChange: function() {
                // update the renderd default value to match those in the conflation configs...
                let type = d3.select( '#conflateType' ).property( 'value' );
                let advancedOpts = AdvancedOpts.getInstance();
                let advOpts = _cloneDeep( advancedOpts.advancedOptions );
                if ( !_isEmpty(advancedOpts.conflationOptions[type.toLowerCase()]) ) {
                    let typeDefaults = advancedOpts.conflationOptions[type.toLowerCase()];
                    advOpts = advOpts.map(function(opt) {
                        if (opt.members.findIndex(m => typeDefaults.hasOwnProperty(m.id)) !== -1) {
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

                let allFavorites = Hoot.config.users[Hoot.user().id].members;

                let currentFavorite = [];

                Object.keys(allFavorites)
                    .forEach(function (key) {
                        if (key === type) {
                            currentFavorite.push(JSON.parse(allFavorites[key]));
                            advOpts = currentFavorite;
                        }
                    });

                let favoriteCheck = currentFavorite.map( o => o.name );

                if (!_isEqual(advOpts, advancedOpts.advancedOptions)) {
                    defaultConfSelected();
                    advancedOpts.createGroups(advOpts);
                }
                if ( favoriteCheck.includes(type) ) {
                    favOptSelected();
                }
                else {
                    // disable & enable the attribute conflation group.
                    [ 'Attribute', 'Differential' ].forEach((conflationGroup) => {
                        let confGroup = d3.select( `.advanced-opts-content #${conflationGroup}_group` ),
                            isGroup = d3.select( '#conflateType' ).property( 'value' ).includes(conflationGroup);

                        confGroup.select( '.adv-opt-title' )
                            .classed( 'adv-opt-title-disabled', !isGroup );

                        confGroup.select( '.adv-opt-toggle' )
                            .classed( 'toggle-disabled', !isGroup );

                        confGroup
                            .select( '.group-body', true );
                    });
                }
                if ( _isEqual(advOpts, advancedOpts.advancedOptions) ) {
                    // hide update and delete buttons until default member values are changed
                    defaultConfSelected();
                    advancedOpts.createGroups(advOpts);
                }

                function favOptSelected() {
                    d3.select('#deleteFav').classed('hidden', false);
                    d3.select('#updateFav').classed('hidden', false);
                    d3.select('#saveFav').classed('hidden', true);

                }

                function defaultConfSelected() {
                    d3.select('#deleteFav').classed('hidden', true);
                    d3.select('#updateFav').classed('hidden', true);
                    d3.select('#saveFav').classed('hidden', true);
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
            hidden: true,
            multipartId: 'ingestFileUploader',
            onChange: () => this.handleMultipartChange()
        },
        {
            label: 'Import URL',
            id: 'importUrl',
            class: 'import-url',
            inputType: 'text',
            placeholder: 'Enter URL (http, ftp, s3)',
            required: false,
            hidden: true,
            onChange: d => this.handleUrlChange( d )
        },
        {
            label: 'Remote Username',
            id: 'importRemoteUsername',
            class: 'import-username',
            inputType: 'text',
            placeholder: 'Enter remote username (or access key id)',
            hidden: true,
            required: false
        },
        {
            label: 'Remote Password',
            id: 'importRemotePassword',
            class: 'import-password',
            inputType: 'password',
            placeholder: 'Enter remote password (or access key secret)',
            hidden: true,
            required: false
        },
        {
            label: 'Layer Name',
            id: 'importLayerName',
            class: 'layer-name',
            inputType: 'text',
            placeholder: 'Enter name',
            required: true,
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Path',
            id: 'importPathName',
            class: 'path-name',
            inputType: 'combobox',
            placeholder: 'Select a path',
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
            itemKey: 'displayPath'
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
            label: 'Upload as Single Layer',
            id: 'importMultiAsSingle',
            inputType: 'checkbox',
            checkbox: 'cboxMultiAsSingle',
            onChange: () => this.handleSingleLayerChange()
        },
        {
            label: 'New Layer Name',
            id: 'importMultiAsSingleName',
            inputType: 'text',
            disabled: true,
            required: true,
            onChange: d => this.validateTextInput( d ),
            onBlur: d => this.deduplicateName( d )
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
            placeholder: 'Select a path',
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
            itemKey: 'displayPath'
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

export function saveFavoriteOpt() {
    return [
        {
            label: 'Favorite Adv. Opts Group Name',
            id: 'addFolderName',
            class: 'new-folder-name',
            data: [],
            inputType: 'text',
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
            placeholder: 'Select a path',
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
          exportFgdbId = 'exportAppendFgdb',
          exportThematic = 'exportThematic',
          exportHootTags = 'exportHootTags',
          that = this;

    function changeExport() {
        const showFgdbTemplate = d3.select( `#${exportFormatId}` ).property( 'value' ) === 'File Geodatabase'
                        && d3.select( `#${exportComboId}` ).property( 'value' ).indexOf('OSM') === -1;

        d3.select( `#${exportFgdbId}_container` )
            .classed( 'hidden', !showFgdbTemplate );

        const showThematic = d3.select( `#${exportFormatId}` ).property( 'value' ).indexOf('OpenStreetMap') === -1
                        && d3.select( `#${exportComboId}` ).property( 'value' ).indexOf('OSM') === -1;

        d3.select( `#${exportThematic}_container` )
            .classed( 'hidden', !showThematic );

        const showHootTags = d3.select( `#${exportFormatId}` ).property( 'value' ).indexOf('OpenStreetMap') === 0
                        && d3.select( `#${exportComboId}` ).property( 'value' ).indexOf('OSM') === 0;

        d3.select( `#${exportHootTags}_container` )
            .classed( 'hidden', !showHootTags );

        that.validate( exportComboId );
        that.validate( exportFormatId );
    }

    let meta = [
        {
            label: 'Translation Schema',
            id: exportComboId,
            inputType: 'combobox',
            readonly: 'readonly',
            data: this.translations.map(t => t.name),
            value: 'OSM',
            onChange: changeExport
        },
        {
            label: 'Export Format',
            id: exportFormatId,
            inputType: 'combobox',
            data: [ 'File Geodatabase', 'GeoPackage (GPKG)', 'Shapefile', 'OpenStreetMap (OSM)', 'OpenStreetMap (PBF)' ],
            value: 'OpenStreetMap (OSM)',
            onChange: changeExport
        },
        {
            label: 'Append to ESRI FGDB Template?',
            id: exportFgdbId,
            inputType: 'checkbox',
            checked: false,
            hidden: true
        },
        {
            label: 'Export data in thematic groups?',
            id: exportThematic,
            inputType: 'checkbox',
            checked: true,
            hidden: true
        },
        {
            label: 'Include Hootenanny tags?',
            id: exportHootTags,
            inputType: 'checkbox',
            checked: false,
            hidden: false
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
            label: 'Path',
            id: 'importPathName',
            class: 'path-name',
            inputType: 'combobox',
            placeholder: 'Select a path',
            data: this.folderList,
            sort: true,
            itemKey: 'path',
            onChange: () => {}
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

export function addTranslationFolderForm() {
    return [
        {
            label: 'Name',
            id: 'addTranslationFolderName',
            class: 'new-translation-folder-name',
            inputType: 'text',
            onChange: () => this.validateTextInput()
        },
        {
            label: 'Path',
            id: 'importPathName',
            class: 'path-name',
            inputType: 'combobox',
            placeholder: 'Select a path',
            readonly: 'readonly',
            data: this.folderList,
            value: this.defaultFolder.path,
            sort: true,
            itemKey: 'path',
            onChange: () => this.validateTextInput()
        },
        {
            label: 'Public',
            id: 'addTranslationFolderVisibility',
            inputType: 'checkbox',
            value: 'Public',
            checked: false,
            class: 'folder-checkbox'
        }
    ];
}

export function translationViewForm() {
    return [
        {
            label: 'Name',
            id: 'translationName',
            inputType: 'text',
            onChange: () => this.validateFields()
        },
        {
            label: 'Description',
            id: 'translationSaveDescription',
            inputType: 'text',
            onChange: () => this.validateFields()
        },
        {
            label: 'Path',
            id: 'importPathName',
            class: 'path-name',
            inputType: 'combobox',
            placeholder: 'Select a path',
            data: this.folderList,
            sort: true,
            itemKey: 'path',
            onChange: () => this.validateFields()
        },
        {
            label: 'Paste New Translations in Box (or drag .js file into text area)',
            id: 'translationTemplate',
            inputType: 'textarea',
            data: this.templateText || null,
            onChange: () => this.validateFields()
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
            label: 'Versions',
            id: 'aboutVersions',
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
            cmd: this.cmd( '⇧B' ),
            action: async () => {
                let currentReviewItem = Hoot.ui.conflicts.data.currentReviewItem;
                const queryParams = {
                    mapId: currentReviewItem.mapId,
                    relationId: currentReviewItem.relationId
                };
                let { reviewBookmarks } = await Hoot.api.getBookmarkById( queryParams );

                // If review bookmark doesnt exist publish new one, else show comments of current one
                if ( reviewBookmarks.length === 0 ) {
                    this.resolve.publishBookmark();
                } else {
                    this.resolve.displayBookmarkComments( reviewBookmarks[0] );
                }

            }
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

export function exportAlphaShape() {
    return [
        {
            label: 'Alpha (meters)',
            id: 'alpha',
            inputType: 'text',
            placeholder: '10000',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Buffer (meters)',
            id: 'buffer',
            inputType: 'text',
            placeholder: '0',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Add alpha shape to map?',
            id: 'addToMap',
            inputType: 'checkbox',
            checked: true
        }
    ];
}

export function exportTaskGrid() {
    return [
        {
            label: 'Maximum nodes per task grid',
            id: 'maxnodes',
            inputType: 'text',
            placeholder: '10000',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Pixel size (decimal degrees)',
            id: 'pxsize',
            inputType: 'text',
            placeholder: '0.001',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Clip task grid to alpha shape?',
            id: 'clipToAlpha',
            inputType: 'checkbox',
            onChange: d => this.toggleAlphaInputs( d ),
            checked: true
        },
        {
            label: 'Alpha (meters)',
            id: 'alpha',
            inputType: 'text',
            placeholder: '10000',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Buffer (meters)',
            id: 'buffer',
            inputType: 'text',
            placeholder: '0',
            onChange: d => this.validateTextInput( d )
        },
        {
            label: 'Add task grid to map?',
            id: 'addToMap',
            inputType: 'checkbox',
            checked: true
        }
    ];
}
