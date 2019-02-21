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
            data: [ 'Reference', 'Network', 'Cookie Cutter & Horizontal', 'Differential', 'Differential w/ Tags', 'Attribute' ],
            onChange: (d) => {
                const selection = d3.select( `#${d.id}` ),
                      type = !selection.empty() && selection.property( 'value' );
                
                if (type && type === 'Network') { // when reference selected, make road option network...
                    d3.selectAll( '.conflate-type-toggle' ).each(function() {
                        let selection = d3.select( this );

                        if (selection) {
                            let checked = selection.datum().id === 'roadOptions';
                            selection.property( 'checked', checked );
                        }
                    });
                }
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
        {
            label: 'Building',
            id: 'buildingOptions',
            matcher: 'hoot::BuildingMatchCreator',
            merger: 'hoot::BuildingMergerCreator',
            members: [
            //     {
            //         label: 'Review if secondary layer building is newer',
            //         id: 'reviewSecondaryBuildingLayer',
            //         key: 'building.review.if.secondary.newer',
            //         inputType: 'checkbox',
            //         checked: false
            //     },
            //     {
            //         label: 'Date format',
            //         id: 'buildingDateFormat',
            //         key: 'building.date.format',
            //         inputType: 'text'
            //     },
            //     {
            //         label: 'Date tag key',
            //         id: 'buildingDateTagKey',
            //         key: 'building.date.tag.key',
            //         inputType: 'text'
            //     },
            //     {
            //         label: 'Keep complex geometry when auto merging',
            //         id: 'buildingKeepComplexGeom',
            //         key: 'building.keep.more.complex.geometry.when.auto.merging',
            //         inputType: 'checkbox',
            //         checked: false
            //     },
            //     {
            //         label: 'Match Creator',
            //         id: 'buildingMatchCreator',
            //         key: 'match.creators',
            //         inputType: 'checkbox',
            //         hootVal: 'hoot::BuildingMatchCreator',
            //         checked: false
            //     },
            //     {
            //         label: 'Merger Creator',
            //         id: 'buildingMergeCreator',
            //         key: 'merger.creators',
            //         hootVal: 'hoot::BuildingMergerCreator'
            //     },
            //     {
            //         label: 'Review non 1:1 Building Matches',
            //         id: 'reviewNonOneOneBuildingMatches',
            //         key: 'building.review.matched.other.than.one.to.one',
            //         inputType: 'checkbox',
            //         checked: false
            //     }
            ]
        },
        {
            label: 'Poi Generic',
            id: 'poiGenericOptions',
            matcher: 'hoot::ScriptMatchCreator,PoiGeneric.js',
            merger: 'hoot::ScriptMergerCreator',
            members: []
        },   
        {
            label: 'Road',
            id: 'roadOptions',
            matcher: 'hoot::HighwayMatchCreator',
            merger: 'hoot::HighwayMergerCreator',
            members: [
                // {
                //     'label',
                // }
                // {
                //     label: 'Engines',
                //     id: 'roadConflationEngines',
                //     inputType: 'combobox',
                //     data: [ 'Unify', 'Network' ],
                //     value: 'Network',
                //     members: {
                //         all: [
                //             'matchHighwayClassifier',
                //             'roadMatchCreator',
                //             'roadMergerCreator',
                //             'roadOnlyMergeTags',
                //         ],
                //         unify: [
                //             'highwayMatcherHeadingDelta',
                //             'highwayMatcherMaxAngle',
                //             'highwayMaxEnumDiff'
                //         ],
                //         network: [
                //             'networkMatcher'
                //         ]
                //     },
                //     matchersMergers: {
                //         network: [ 
                //             'hoot::NetworkMatchCreator',
                //             'hoot::NetworkMergerCreator'
                //         ],
                //         unify: [
                //             'hoot::HighwayMatchCreator',
                //             'hoot::HighwayMergerCreator'
                //         ]
                //     },
                //     onChange: (d) => {
                //         if (!d.changed) d.changed = true;
                //         const members = d.members,
                //               selection = d3.select( `#${d.id}` ),
                //               value = selection.select( 'input' ).property( 'value' );

                //         if ( !value ) return;
                //         if ( d.value === value ) return;

                //         d.value = value;

                //         const updateMember = (id, hidden) => {
                //             const member = d3.select( `#${id}` );
                //             if ( !member.empty() ) {
                //                 member.classed('hidden', hidden); // show only relevent children
                //                 let data = member.datum();
                //                 data.hidden = hidden; // reset each value...
                //                 if (data.hasOwnProperty( 'default' ) ) {
                //                     if (data.hasOwnProperty( 'value' )) {
                //                         data.value = data.default;
                //                     }
                //                     data.hootVal = data.default;
                //                 }
                //                 if (data.hasOwnProperty( 'checked' ) ) {
                //                     data.checked = false;
                //                 }
                //             }
                //         };

                //         Object.keys(members).forEach(key => {
                //            const hidden = key !== d.value.toLowerCase() && key !== 'all';
                //            members[key].forEach(member => updateMember( member, hidden ) );
                //         });
                //     }
                // },
                // {
                //     label: 'Road Search Radius',
                //     id: 'roadSearchRadius',
                //     key: 'search.radius.highway',
                //     inputType: 'text',
                //     hidden: false
                // },
                // {
                //     label: 'Match Highway Classifier',
                //     id: 'matchHighwayClassifier',
                //     key: 'conflate.match.highway.classifier',
                //     checked: false,
                //     inputType: 'checkbox',
                //     hidden: false,
                //     hootVal: 'hoot::HighwayRfClassifier'
                // },
                // {
                //     label: 'Only Merge Tags',
                //     id: 'roadOnlyMergeTags',
                //     key: 'highway.merge.tags.only',
                //     inputType: 'checkbox',
                //     hidden: true,
                //     checked: false,
                // },
                // {
                //     label: 'Highway Matcher Heading Delta',
                //     id: 'highwayMatcherHeadingDelta',
                //     key: 'highway.matcher.heading.delta',
                //     inputType: 'text',
                //     extrema: [ 0.0, 360.0 ],
                //     hidden: true
                // },
                // {
                //     label: 'Highway Matcher Max Angle',
                //     id: 'highwayMatcherMaxAngle',
                //     key: 'highway.matcher.max.angle',
                //     extrema: [0.0, 360.0],
                //     inputType: 'text',
                //     hidden: true
                // },
                // {
                //     label: 'Highway Max Enum Diff',
                //     id: 'highwayMaxEnumDiff',
                //     key: 'highway.max.enum.diff',
                //     inputType: 'text',
                //     extrema: [ 0.0, 1.6 ],
                //     hidden: true
                // },
                // {
                //     label: 'Network Matcher',
                //     id: 'networkMatcher',
                //     key: 'network.matcher',
                //     inputType: 'checkbox',
                //     checked: false,
                //     hidden: false,
                //     hootVal: 'hoot::ConflictsNetworkMatcher'
                // }
            ]
        },
        {
            label: 'Waterway',
            id: 'waterwayOptions',
            matcher: 'hoot::ScriptMatchCreator,LinearWaterway.js',
            merger: 'hoot::ScriptMergerCreator',
            members: []
        },
        {
            label: 'Point to Polygon',
            id: 'pointToPolyOptions',
            matcher: 'hoot::PoiPolygonMatchCreator',
            merger: 'hoot::PoiPolygonMergerCreator',
            members: [
                {
                    label: 'Match Creator',
                    id: 'poiToPolyMatchCreator',
                    key: 'match.creators',
                    inputType: 'checkbox',
                    checked: false,
                    hootType: 'list',
                    hootVal: 'hoot::PoiPolygonMatchCreator'
                },
                {
                    label: 'Merger Creator',
                    id: 'poiToPolyMergerCreator',
                    key: 'merger.creators',
                    inputType: 'checkbox',
                    checked: false,
                    hootType: 'list',
                    hootVal: 'hoot::PoiPolygonMergerCreator'
                },
                {
                    label: 'Address Additional Tags',
                    id: 'poiToPolyAdditionalTags',
                    key: 'address.additional.tag.keys',
                    inputType: 'checkbox',
                    checked: false
                },
                {
                    label: 'Address Match Enabled',
                    id: 'poiToPolyAddressMatchEnabled',
                    key: 'poi.polygon.address.match.enabled',
                    inputType: 'checkbox',
                    checked: false
                },
                {
                    label: 'Merge Many POI to Single Polygon Matches',
                    id: 'poiToPolyMergeManyPOIToSinglePoly',
                    key: 'poi.polygon.auto.merge.many.poi.to.one.poly.matches',
                    inputType: 'checkbox',
                    checked: false
                },
                {
                    label: 'Disable Same Source Conflation',
                    id: 'poiPolyDisableSameSourceConflation',
                    key: 'poi.polygon.disable.same.source.conflation',
                    inputType: 'checkbox',
                    checked: false
                },
                {
                    label: 'Disable Same Source Conflation Match Tag Key Prefix Only',
                    id: 'poiPolyDisableSameSourceConflationTagKeyPrefixOnly',
                    key: 'poi.polygon.disable.same.source.conflation.match.tag.key.prefix.only',
                    inputType: 'checkbox',
                    checked: false
                },
                {
                    label: 'Keep Closest Match Only',
                    id: 'poiPolyKeepClosestMatchOnly',
                    key: 'poi.polygon.keep.closest.matches.only',
                    inputType: 'checkbox',
                    checked: false
                },
                {
                    label:'Match Distance Threshold',
                    id: 'poiPolyMatchDistance',
                    key:'poi.polygon.match.distance.threshold',
                    inputType: 'text',
                    extrema: [ 0, Infinity ],
                    default: null
                },
                {
                    label: 'Match Evidence Threshold',
                    id: 'poiPolyMatchEvidenceThreshold',
                    key:'poi.polygon.match.evidence.threshold',
                    inputType: 'text',
                    extrema: [ 1, 4 ],
                },
                {
                    
                    label: 'Name Score Threshold',
                    id: 'poiPolyNameScoreThreshold',
                    inputType: 'text',
                    key:'poi.polygon.name.score.threshold',
                    extrema: [ -1, 1 ],
                },
                {
                    label: 'Phone Number Additional Tag Keys',
                    id:'poiPolyNumberAdditionalTagKeys',
                    inputType: 'checkbox',
                    key:'phone.number.additional.tag.keys',
                },
                {
                    label:'Phone Number Match Enabled',
                    id: 'poiPolyPhoneNumberMatchEnabled',
                    key:'poi.polygon.phone.number.match.enabled',
                    inputType: 'checkbox',
                },
                {
                    label: 'Phone Number Region Code',
                    id: 'poiPolyPhoneNumberRegionCode',
                    inputType: 'checkbox',
                    key: 'phone.number.region.code',
                },
                {
                    label:'Phone Number Search In Text',
                    id:'poiPolyPhoneNumberSearchInText',
                    inputType: 'checkbox',
                    key:'phone.number.search.in.text',
                },
                {
                    label:'Promote Points With Addresses to POIs',
                    id: 'PoiPolyPromotePointsWithAddressesToPois',
                    inputType: 'checkbox',
                    key:'poi.polygon.promote.points.with.addresses.to.pois',
                },
                {
                    label: 'Review Distance Threshold',
                    id: 'poiPolyReviewDistanceThreshold',
                    key:'poi.polygon.review.distance.threshold',
                    inputType: 'text',
                    extrema: [ 0, Infinity ],
                },
                {
                    label:'Review Evidence Threshold',
                    id: 'poiPolyReviewEvidenceThreshold',
                    inputType: 'text',
                    key:'poi.polygon.review.evidence.threshold',
                    extrema: [ 0, 3 ],
                },
                {
                    label:'Review If Types Match',
                    id: 'poiPolyReviewIfMatchedTags',
                    key:'poi.polygon.review.if.matched.types',
                    inputType: 'checkbox',
                },
                {
                    label:'Review Matches Against Multi-Use Buildings',
                    id: 'poiPolygReviewMultiuseBuildings',
                    key:'poi.polygon.review.multiuse.buildings',
                    inputType: 'checkbox',
                },
                {
                    label:'Source Tag Key',
                    id:'poiPolySourceTagKey',
                    key:'poi.polygon.source.tag.key',
                    inputType: 'checkbox',
                },
                {
                    label:'Type Score Threshold',
                    id:'poiPolyTypeScoreThreshold',
                    key:'poi.polygon.type.score.threshold',
                    extrema: [ 0, 1 ],
                }
            ]
        },
        {
            label: 'Area',
            id: 'areaOptions',
            matcher: 'hoot::ScriptMatchCreator,Area.js',
            merger: 'hoot::ScriptMergerCreator',
            members: []
        },
        {
            label: 'Railway',
            id: 'railwayOptions',
            matcher: 'hoot::ScriptMatchCreator,Railway.js',
            merger: 'hoot::ScriptMergerCreator',
            members: []
        },
        {
            label: 'Powerline',
            id: 'powerlineOptions',
            matcher: 'hoot::ScriptMatchCreator,PowerLine.js',
            merger: 'hoot::ScriptMergerCreator',
            members: []
        }
    ];
}