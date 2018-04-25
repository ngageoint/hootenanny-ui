/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import LayerManager  from './managers/layerManager';
import HootOSM       from './managers/hootOsm';
import Navbar        from './view/navbar';
import Sidebar       from './view/sidebar';
import SettingsPanel from './view/settingsPanel';

/**
 * Entry point for Hoot UI
 */
class Hoot {
    constructor( context ) {
        this.context   = context;
        this.container = context.container();
    }

    init() {
        LayerManager.ctx = this.context;
        HootOSM.ctx      = this.context;

        new Navbar( d3.select( '#id-container' ), this.context ).render();
        new SettingsPanel( this.container, this.context ).render();
        new Sidebar( d3.select( '#sidebar' ), this.context ).render();
    }
}

export default Hoot;