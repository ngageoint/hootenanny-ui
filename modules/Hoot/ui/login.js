/** ****************************************************************************************************
 * File: login.html
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/8/18
 *******************************************************************************************************/

import Navbar from './navbar';
import EventEmitter from 'events';
import { select as d3_select } from 'd3-selection';

export default class Login extends EventEmitter {
    constructor() {
        super();
    }

    render( cb, oauthRedirectUrl ) {
        this.cb = cb;
        this.oauthRedirectUrl = oauthRedirectUrl;

        new Navbar( false ).render();

        d3_select( 'body' ).style( 'background-color', '#f6f6f6' );

        let wrapper = d3_select( '#id-sink' )
            .append( 'div' )
            .attr( 'id', 'login-page' );

        let container = wrapper
            .append( 'div' )
            .classed( 'login-container', true );

        let blurb = container
            .append( 'div' );

        blurb
            .append( 'h2' )
            .text( 'What is Hootenanny?' );

        blurb
            .append( 'p' )
            .append( 'em' )
            .text( 'Hootenanny:' );

        blurb
            .append( 'ol' )
            .append( 'li' )
            .text( 'a gathering at which folksingers entertain often with the audience joining in' );

        blurb
            .append( 'p' )
            .append( 'em' )
            .text( 'Conflation' );

        blurb
            .append( 'ol' )
            .append( 'li' )
            .text( 'Fancy word for merge' );

        blurb
            .append( 'p' );

        blurb
            .append( 'p' )
            .text( 'Hootenanny is an open source conflation tool developed to facilitate automated and semi-automated conflation of critical Foundation GEOINT features in the topographic domain. In short, it merges multiple maps of geodata into a single seamless map.' );

        blurb
            .append( 'p' )
            .text( 'Hootenanny conflation occurs at the dataset level, where the user\'s workflow determines the best reference dataset, source content, geometry, and attributes to transfer to the output map. Hootenanny\'s internal processing leverages the key value pair structure of OpenStreetMap (OSM) for improved utility and applicability to broader user groups. Normalized attributes can be used to aid in feature matching, and OSM’s free tagging system allows the map to include an unlimited number of attributes describing each feature.' );

        blurb
            .append( 'p' )
            .html( 'Hootenanny is developed under the open source General Public License (GPL) and maintained on the National Geospatial-Intelligence Agency’s (NGA) GitHub <a href=\"https://github.com/ngageoint/hootenanny\" target=\"_new\">site</a>.' );

        blurb
            .append( 'h2' )
            .text( 'Access & Authentication' );

        blurb
            .append( 'p' )
            .text( 'Hootenanny utilizes a third party to associate your contributions and perform basic authorization. You should have seen a popup dialog directing you to grant Hootenanny access to basic information about who you are. Once you have completed that wokflow, you should not see this again until your session is removed or expires. It is very common for browsers to block popups, see below for allowing us to create a window.' );

        container
            .append( 'h2' )
            .text( 'Enabling Popup Windows: Chrome & Chromium' );

        let table = container
            .append( 'div' )
            .classed( 'hoot-login-table', true );

        let row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell text', true )
            .html( '&#9658; Check the right side of the address bar. Click the discrete notification' );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell text', true )
            .html( '&#9658; Click \'Always Allow\' and \'Done\'' );


        row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell', true )
            .append( 'img' )
            .attr( 'src', 'img/login-popup-chrome-1.png' );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell', true )
            .append( 'img' )
            .attr( 'src', './img/login-popup-chrome-2.png' );


        container
            .append( 'h2' )
            .text( 'Enabling Popup Windows: Firefox' );

        table = container
            .append( 'div' )
            .classed( 'hoot-login-table', true );

        row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell', true )
            .html( '&#9658; You might see a yellow bar with a notification of a popup blocked' );

        row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell', true )
            .append( 'img' )
            .attr( 'src', './img/login-popup-firefox-1.png' );

        row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell pad-top', true )
            .html( '&#9658; Click \'Options\' and then select \'Allow...\' or \'Show...\'' );

        row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell', true )
            .append( 'img' )
            .attr( 'src', './img/login-popup-firefox-2.png' );

        row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell pad-top', true )
            .html( '&#9658; Alternatively if the yellow notification is not present, look to the left in the address bar. Click on the discrete notification, and then select \'Show...\' or toggle \'Block\' to \'Allow\'' );

        row = table
            .append( 'div' )
            .classed( 'hoot-login-row', true );

        row
            .append( 'div' )
            .classed( 'hoot-login-cell', true )
            .append( 'img' )
            .attr( 'src', './img/login-popup-firefox-3.png' );

        container
            .append( 'h2' )
            .text( 'Without Popup Windows' );

        container
            .append( 'p' )
            .html( '&#9658; Click ' )
            .append( 'a' )
            .text( 'here' )
            .on('click', () => window.location = this.oauthRedirectUrl );

        this.cb();

        return this;
    }

}
