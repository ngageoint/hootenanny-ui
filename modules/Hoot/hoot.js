/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

import components from './components/index';

class Hoot {
    constructor( context ) {
        this.$container = context.container();
        this.components = components( context );
    }

    init() {
        Promise.all( this.components.map( component => component.init( this.$container ) ) );
    }
}

export default Hoot;