/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

'use strict';

import Navbar from './navbar';
import SettingsView from './settingsView';

export default context => {
    return [
        new Navbar( context ),
        new SettingsView( context )
    ];
}