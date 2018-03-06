/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import FolderManager from './model/FolderManager';
import components from './components/index';

class Hoot {
    constructor( context ) {
        this.container  = context.container();
        this.components = components( context );
    }

    init() {
        FolderManager.refreshAll().then( () => {
            Promise.all( this.components.map( component => component.init( this.container ) ) );
        } );
    }
}

export default Hoot;