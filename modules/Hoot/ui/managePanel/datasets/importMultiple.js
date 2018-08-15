/*******************************************************************************************************
 * File: importMultiple.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/15/18
 *******************************************************************************************************/

import _                     from 'lodash-es';
import API                   from '../../../managers/api';
import FolderManager         from '../../../managers/folderManager';
import FormFactory           from '../../../tools/formFactory';
import { importDatasetForm } from '../../../config/domMetadata';
import { getBrowserInfo }    from '../../../tools/utilities';
import EventEmitter          from 'events';

export default class ImportMultiple extends EventEmitter {
    constructor( translations ) {
        super();

        this.folderList   = FolderManager._folders;
        this.translations = translations;
        this.browserInfo  = getBrowserInfo();
        this.formFactory  = new FormFactory();

        // Add "NONE" option to beginning of array
        this.translations.unshift( {
            NAME: 'NONE',
            PATH: 'NONE',
            DESCRIPTION: 'No Translations',
            NONE: 'true'
        } );

        if ( this.browserInfo.name.substring( 0, 6 ) !== 'Chrome' ) {
            _.remove( this.importTypes, o => o.value === 'DIR' );
        }

        this.importTypes = [
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

        this.form = importDatasetForm.call( this );
    }
}