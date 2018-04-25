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
        this.optTypes          = [ 'custom', 'horizontal', 'average', 'reference' ];
        this.advOpts           = null;
        this.advHorizontalOpts = null;
        this.advAverageOpts    = null;
        this.advReferenceOpts  = null;
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

        let fields = this.fieldsRetriever.getDefaultFields();

        this.update();
    }

    update() {

    }

    merge( base, override, overrideKeys ) {
        _.forEach( override.members, member => {

        } );
    }

    //getOverrideItems( overrideOptions ) {
    //    return _.map( _.cloneDeep( overrideOptions.members ), option => {
    //        let id       = option.hoot_key.indexOf( '.creators' ) > -1 ? option.id : option.hoot_key.replace( /\./g, '_' ),
    //            required = option.required || false;
    //
    //        return {
    //            id,
    //            required,
    //            hoot_key: option.hoot_key,
    //            defaultvalue: option.defaultvalue
    //        };
    //    } );
    //}
}