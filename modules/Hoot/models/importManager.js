/*******************************************************************************************************
 * File: import.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/14/18
 *******************************************************************************************************/

import _ from 'lodash-es';
import API from '../util/api';

class ImportManager {
    constructor() {

    }

    importDirectory() {

    }

    importData( data ) {
        return API.upload( data )
            .then( resp => this.importStatus( resp ) );
    }

    importStatus( resp ) {
        console.log( resp );
    }
}

export default new ImportManager();