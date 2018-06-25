/** ****************************************************************************************************
 * File: hoot.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import LayerManager from './nodeManagers/layerManager';
import HootOSM      from './nodeManagers/hootOsm';
import Navbar       from './navbar';
import Sidebar      from './sidebar';
import ManagePanel  from './managePanel';

/**
 * Entry point for Hoot UI
 */
export default class Hoot {
    constructor( context ) {
        this.context   = context;
        this.container = context.container();
    }

    init() {
        LayerManager.ctx = this.context;
        HootOSM.ctx      = this.context;

        Promise.all( [
            new Navbar( d3.select( '#id-container' ), this.context ).render(),
            new ManagePanel( this.container, this.context ).render(),
            new Sidebar( d3.select( '#sidebar' ), this.context ).render()
        ] ).then( modules => {
            this.navbar      = modules[ 0 ];
            this.managePanel = modules[ 1 ];
            this.sidebar     = modules[ 2 ];
        } );
    }
}