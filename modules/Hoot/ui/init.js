/*******************************************************************************************************
 * File: init.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import Navbar      from './navbar';
import Sidebar     from './sidebar/sidebar';
import ManagePanel from './managePanel/managePanel';
import Conflicts   from './conflicts/conflicts';

export default class UI {
    render() {
        Promise.all( [
            new Navbar().render(),
            new Sidebar( this.hoot ).render(),
            new ManagePanel( this.hoot ).render(),
            new Conflicts( d3.select( '#content' ) )
        ] ).then( modules => {
            this.navbar  = modules[ 0 ];
            this.sidebar = modules[ 1 ];
            this.conflicts = modules[ 3 ];
        } );
    }
}