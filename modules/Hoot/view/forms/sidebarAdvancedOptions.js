/*******************************************************************************************************
 * File: sidebarAdvancedOptions.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/23/18
 *******************************************************************************************************/

import _   from 'lodash-es';
import API from '../../control/api';

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

        this.advOpts           = allOpts[ 0 ];
        this.advHorizontalOpts = allOpts[ 1 ];
        this.advAverageOpts    = allOpts[ 2 ];
        this.advReferenceOpts  = allOpts[ 3 ];
    }
}