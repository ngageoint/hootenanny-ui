/** ****************************************************************************************************
 * File: helpers.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 11/2/18
 *******************************************************************************************************/

export function keypress( key, code, repeat, ctrlKey, shiftKey, altKey, metaKey, charCode, keyCode, which ) {
    let e = new KeyboardEvent( 'keydown', {
        repeat,
        ctrlKey,
        shiftKey
    } );

    document.dispatchEvent( e );
}
