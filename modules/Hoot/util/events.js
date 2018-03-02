/** ****************************************************************************************************
 * File: Events.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

class Events {
    constructor() {
        this._listeners = {};
    }

    _keyExists( k ) {
        return this._listeners[ k ] !== undefined;
    }

    send( k, v ) {
        if ( this._keyExists( k ) ) {
            this._listeners[ k ].forEach( d => {
                if ( !d.ctx ) {
                    d.fn( v );
                } else {
                    d.fn.call( d.ctx, v );
                }
            } );
        }
    }

    listen( k, fn, ctx, src ) {
        const parts = k.split( ' ' );

        parts.forEach( d => {
            const x = { fn, ctx, src };

            if ( this._keyExists( d ) ) {
                this._listeners[ d ].push( x );
            } else {
                this._listeners[ d ] = [ x ];
            }
        } );
    }

    remove( k, fn, ctx ) {
        const parts = k.split( ' ' );

        parts.forEach( d => {
            if ( this._keyExists( d ) ) {
                delete this._listeners[ k ];
            }
        } );
    }
}

export default new Events();