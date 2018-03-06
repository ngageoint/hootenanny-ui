/** ****************************************************************************************************
 * File: nodeManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/5/18
 *******************************************************************************************************/

class NodeManager {
    constructor() {

    }

    set( key, val ) {
        this[ key ] = val;
    }

    get( key ) {
        return this[ key ];
    }
}

export default new NodeManager();