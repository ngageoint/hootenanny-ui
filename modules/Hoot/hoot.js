/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import FolderManager from './models/folderManager';
import Navbar from './components/navbar';
import Sidebar from './components/sidebar';
import SettingsPanel from './components/settingsPanel';

/**
 * Entry point for Hoot UI
 */
class Hoot {
    constructor( context ) {
        this.container = context.container();
    }

    init() {
        new Navbar( this.container ).render();
        new SettingsPanel( this.container ).render();
        new Sidebar( d3.select( '#sidebar' ) ).render();
    }
}

export default Hoot;