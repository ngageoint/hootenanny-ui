/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/6/18
 *******************************************************************************************************/

import Navbar from './navbar';
import SettingsView from './settingsPanel';

export default context => {
    return [
        new Navbar( context ),
        new SettingsView( context )
    ];
}