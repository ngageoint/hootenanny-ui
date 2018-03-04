/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import API from './api';
import components from './components/index';

class Hoot {
    constructor( context ) {
        this.api = API;

        this.container  = context.container();
        this.components = components( context );
    }

    init() {
        Promise.all( [
            this.api.getFolders(),
            this.api.getLayers(),
            this.api.getLinks()
        ] ).then( data => {
            this.folders = data[ 0 ];
            this.layers  = data[ 1 ];
            this.links   = data[ 2 ];
        } );

        Promise.all( this.components.map( component => component.init( this.container ) ) );
    }
}

export default Hoot;