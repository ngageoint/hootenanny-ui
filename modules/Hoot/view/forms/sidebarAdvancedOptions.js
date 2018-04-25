/*******************************************************************************************************
 * File: sidebarAdvancedOptions.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/23/18
 *******************************************************************************************************/

import _               from 'lodash-es';
import API             from '../../control/api';
import FieldsRetriever from '../models/advancedOptions/fieldsRetriever';

export default class SidebarAdvancedOptions {
    constructor() {
        this.optTypes        = [ 'custom', 'horizontal', 'average', 'reference' ];
        this.advancedOptions = null;
    }

    async init() {
        let allOpts = await Promise.all( _.map( this.optTypes, type => API.getAdvancedOptions( type ) ) );

        this.advancedOptions = {
            base: allOpts[ 0 ],
            horizontal: allOpts[ 1 ],
            average: allOpts[ 2 ],
            reference: allOpts[ 3 ]
        };

        this.fieldsRetriever = new FieldsRetriever( _.cloneDeep( this.advancedOptions ) );

        this.update();
    }

    update() {
        let fields = this.fieldsRetriever.getDefaultFields();

    }
}