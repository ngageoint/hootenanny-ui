/*******************************************************************************************************
 * File: init.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/16/18
 *******************************************************************************************************/

import Login       from './login';
import Navbar      from './navbar';
import Sidebar     from './sidebar/sidebar';
import ManagePanel from './managePanel/managePanel';
import Conflicts   from './conflicts/conflicts';

export default class UI {
    constructor() {
        this.login = new Login();
    }

    render() {
        Promise.all( [
            new Navbar( true ).render(),
            new Sidebar().render(),
            new ManagePanel().render(),
            new Conflicts( d3.select( '#content' ) )
        ] ).then( modules => {
            this.navbar      = modules[ 0 ];
            this.sidebar     = modules[ 1 ];
            this.managePanel = modules[ 2 ];
            this.conflicts   = modules[ 3 ];
        } );
    }
}
