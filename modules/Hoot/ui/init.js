/*******************************************************************************************************
 * File: init.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import Navbar      from './navbar';
import Sidebar     from './sidebar/sidebar';
import ManagePanel from './managePanel/managePanel';
import Conflicts   from './conflicts/conflicts';
import { select as d3_select } from 'd3-selection';
export default class UI {
    render() {
        Promise.all( [
            new Navbar( true ).render(),
            new Sidebar().render(),
            new ManagePanel().render(),
            new Conflicts( d3_select( '#content' ) )
        ] ).then( modules => {
            this.navbar      = modules[ 0 ];
            this.sidebar     = modules[ 1 ];
            this.managePanel = modules[ 2 ];
            this.conflicts   = modules[ 3 ];
        } );
    }
}
