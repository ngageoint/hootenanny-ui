/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import API from './api';
import components from './components/index';

class Hoot {
    constructor( context ) {
        this.api        = API;

        this.container  = context.container();
        this.components = components( context );
    }

    async init() {
        this.folders = await this.api.getFolders();
        
        Promise.all( this.components.map( component => component.init( this.container ) ) );
    }
}

export default Hoot;