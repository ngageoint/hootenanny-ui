/** ****************************************************************************************************
 * File: domElements.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/1/18
 *******************************************************************************************************/

export const datasetButtons = [
    {
        title: 'Import Single Dataset',
        icon: 'play_for_work',
        onClick: 'import-dataset-single',
        contextmenu: 'bulkimport'
    },
    {
        title: 'Import Directory',
        icon: 'move_to_inbox',
        onClick: 'import-dataset-directory'
    },
    {
        title: 'Add Folder',
        icon: 'create_new_folder',
        onClick: 'add-dataset-folder'
    },
    {
        title: 'Refresh Datasets',
        icon: 'refresh',
        onClick: 'refresh-dataset-layers'
    }
];

export const datasetTableHeaders = [
    {
        title: 'Dataset',
        width: '9%'
    },
    {
        title: 'Last Accessed',
        width: '6%'
    },
    {
        title: 'Import Date',
        width: '6%'
    },
    {
        title: 'Size',
        width: '1%'
    }
];

export const importDatasetTypes = [
    {
        title: 'File (shp, zip, gdb.zip)',
        value: 'FILE'
    },
    {
        title: 'File (osm, osm.zip, pbf)',
        value: 'OSM'
    },
    {
        title: 'File (geonames, txt)',
        value: 'GEONAMES'
    },
    {
        title: 'Directory (FGDB)',
        value: 'DIR'
    }
];

export const transAssistButtons = [
    {
        title: 'Upload File(s)',
        icon: 'play_for_work',
        onClick: ''
    },
    {
        title: 'Upload Folder',
        icon: 'move_to_inbox',
        onClick: ''
    }
];

export const contextMenus = {
    dataset: {
        multiDataset: {
            title: 'Export Selected Datasets',
            icon: 'export',
            click: 'bulkexportDataset'
        },
        singleDataset: [
            {
                title: 'Export',
                icon: 'export',
                click: 'exportDataset'
            },
            {
                title: 'Prepare for Validation',
                icon: 'sprocket',
                click: 'prepValidation'
            },
            {
                title: 'Filter non-HGIS POIs',
                icon: 'sprocket',
                click: 'filter'
            }
        ]
    },
    folder: [
        {
            title: 'Delete',
            icon: 'trash',
            click: 'deleteFolder'
        },
        {
            title: 'Add Dataset',
            icon: 'data',
            click: 'addDataset'
        },
        {
            title: 'Add Folder',
            icon: 'folder',
            click: 'addFolder'
        },
        {
            title: 'Export Data in Folder',
            icon: 'export',
            click: 'exportFolder'
        }
    ]
};

export function conflictButtons() {
    return [
        {
            id: 'bookmark_review',
            name: 'share_review',
            text: 'Bookmark Review',
            class: '_icon plus fill-grey button round pad0y pad1x small strong',
            cmd: this.cmd( 'Ctrl+b' )
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