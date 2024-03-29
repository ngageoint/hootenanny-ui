/** ****************************************************************************************************
 * File: login.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/14/18
 *******************************************************************************************************/

import '../../css/hoot/login.scss';
import { baseUrl } from './config/apiConfig';

class Login {
    constructor() {
        this.baseUrl = baseUrl;
    }

    async init() {
        try {
            this.oauthRedirectUrl = await this.getOAuthRedirectUrl();

            document.querySelector('#here-click').addEventListener('click', () => {
                window.location = this.oauthRedirectUrl;
            });

            document.querySelector('#logoutTabBtn').addEventListener('click', () => {
                this.launchOAuthLogin();
            });

            this.launchOAuthLogin();
        } catch (e) {
            console.error(e);
        } finally { /* eslint-disable */
            return this;
        }

    }

    async authorize() {

        const params = {
            method: 'HEAD'
        };

        return fetch(`${ this.baseUrl }/info/about/servicesVersionInfo`, params)
            .then(resp => {
                if (resp.status === 200) {
                    //a valid session exists so go to app main page
                    let pathname = window.location.pathname;
                    window.location.replace( pathname.substr( 0, pathname.lastIndexOf( '/' ) + 1 ) );
                } else if (resp.status === 401 || resp.status === 403) {
                    //client is not authenticated so do login
                    login.init();
                } else {
                    alert('Cannot connect to Hootenanny Services.')
                }
            });

    }

    findGetParameter( parameterName ) {
        var result = null,
            tmp    = [];

        location.search
            .substr( 1 )
            .split( '&' )
            .forEach( function( item ) {
                tmp = item.split( '=' );
                if ( tmp[ 0 ] === parameterName ) result = decodeURIComponent( tmp[ 1 ] );
            } );

        return result;
    }

    getOAuthRedirectUrl() {
        const params = {
            method: 'GET',
            headers: { 'Content-Type': 'text/plain' }
        };

        return fetch(`${ this.baseUrl }/auth/oauth2/authorize`, params)
            .then(resp => {
                if (resp.status !== 200) throw Error
                return resp.text();
            })
    }

    launchOAuthLogin() {
        // in parent
        window.open( this.oauthRedirectUrl, 'hootenannyLoginRedirect', 'width=500,height=800,toolbar=no,status=no,menubar=no' );

        window.oAuthDone = ( e, user_object ) => {
            if ( e ) {
                window.console.warn( 'Failed to verify oauth tokens w/ provider:' );
                window.console.warn( 'Error ', e.message || null );

                window.alert( e.message );
                window.history.pushState( {}, document.title, window.location.pathname );

            } else {
                if ( localStorage ) {
                    localStorage.setItem( 'user', JSON.stringify( user_object ) );
                }
            }
        };
    }

    verifyOAuth(code, state) {
        const params = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const url = `${this.baseUrl}/auth/oauth2/callback?code=${code}&state=${state}`;
        fetch(url, params)
            .then(resp => {
                if (!resp.ok) {
                    return resp.text().then(text => { throw new Error(text) })
                } else {
                    return resp.json();
                }
            } )
            .then( resp => {
                if ( opener ) {

                    let pathname = opener.location.pathname;
                    // redirect parent
                    opener.location.replace( pathname.substr( 0, pathname.lastIndexOf( '/' ) + 1 ) );

                    // callback
                    opener.oAuthDone( null, resp );

                    // close self
                    self.close();
                }
            } )
            .catch( err => {
                if ( opener ) {
                    opener.oAuthDone( err, null );

                    self.close();
                }
            } );
    }
}

window.Login = Login;

export default Login;
