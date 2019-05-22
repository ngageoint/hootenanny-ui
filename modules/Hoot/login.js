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

        } catch (e) {
            console.log(e);
        } finally { /* eslint-disable */
            return this;
        }

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

        return fetch(`${ this.baseUrl }/auth/oauth1/request`, params)
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
                window.console.warn( 'XMLHttpRequest.status', e.status || null );
                window.console.warn( 'XMLHttpRequest.responseText ', e.responseText || null );

                window.alert( 'Failed to complete oauth handshake. Check console for details & retry.' );
                window.history.pushState( {}, document.title, window.location.pathname );

            } else {
                if ( localStorage ) {
                    localStorage.setItem( 'user', JSON.stringify( user_object ) );
                }
            }
        };
    }

    verifyOAuth(oauthToken, oauthVerifier) {
        const params = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const url = `${this.baseUrl}/auth/oauth1/verify?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`;
        fetch(url, params)
            .then(resp => {
                if (resp.status !== 200) throw error;
                return resp.json();
            } )
            .then( resp => {
                if ( opener ) {
                    window.onbeforeunload = function() {
                        opener.oAuthDone( null, resp );
                    };

                    let pathname = opener.location.pathname;

                    // redirect parent
                    opener.location.replace( pathname.substr( 0, pathname.lastIndexOf( '/' ) + 1 ) );

                    // close self
                    window.close();
                } else {
                    localStorage.setItem( 'user', JSON.stringify( resp ) );

                    let pathname = window.location.pathname;

                    window.location.replace( pathname.substr( 0, pathname.lastIndexOf( '/' ) + 1 ) );
                }
            } )
            .catch( err => {
                if ( opener ) {
                    window.onbeforeunload = function() {
                        opener.oAuthDone( err, null );
                    };

                    self.close();
                } else {
                    window.alert( 'Failed to complete oauth handshake. Check console for details & retry.' );
                    // clear oauth params.
                    window.history.pushState( {}, document.title, window.location.pathname );
                }
            } );
    }
}

window.Login = Login;

export default Login;
