/** ****************************************************************************************************
 * File: domElements.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/1/18
 *******************************************************************************************************/

export const datasetButtons = [
    {
        title: 'Import Single Dataset',
        icon: 'play_for_work',
        class: 'dataset-import-single',
        contextmenu: 'bulkimport'
    },
    {
        title: 'Import Directory',
        icon: 'move_to_inbox',
        class: 'dataset-import-directory'
    },
    {
        title: 'Add Folder',
        icon: 'create_new_folder',
        class: 'dataset-add-folder'
    },
    {
        title: 'Refresh Datasets',
        icon: 'refresh',
        class: 'dataset-refresh-layers'
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