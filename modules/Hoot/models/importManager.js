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

    importData( elems ) {
        let transVal    = elems.schemaInput.property( 'value' ),
            typeVal     = elems.typeInput.property( 'value' ),

            transCombo  = elems.schemaInput.datum(),
            typeCombo   = elems.typeInput.datum(),

            translation = _.filter( transCombo.combobox.data, o => o.DESCRIPTION === transVal )[ 0 ],
            importType  = _.filter( typeCombo.combobox.data, o => o.title === typeVal )[ 0 ];

        let data = {
            NONE_TRANSLATION: translation.NONE === 'true',
            TRANSLATION: translation.PATH,
            INPUT_TYPE: importType.value,
            INPUT_NAME: elems.layerNameInput.property( 'value' ),
            formData: this.getFormData( elems.fileIngest.node().files )
        };

        API.upload( data );
    }

    getFormData( files ) {
        let formData = new FormData();

        _.forEach( files, ( file, i ) => {
            formData.append( `eltuploadfile${ i }`, file );
        } );

        return formData;
    }
}

export default new ImportManager();