/** ****************************************************************************************************
 * File: note.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/1/18
 *******************************************************************************************************/

import Hoot from '../../../hoot';
import EditNote from './editNote';

export default class Note {
    constructor( notesBody, isNew ) {
        this.notesBody = notesBody;
        this.isNew     = isNew;
    }

    render( noteData ) {
        this.data = noteData;

        this.note = this.notesBody
            .insert( 'div', '.add-note-button' )
            .classed( 'note hoot-form-field fill-white small keyline-all round', true );

        this.createHeader();
        this.createTextField();
    }

    createHeader() {
        let header = this.note
            .append( 'div' )
            .classed( 'form-header keyline-bottom', true );

        header
            .append( 'div' )
            .classed( 'spacer', true );

        header
            .append( 'div' )
            .append( 'h4' )
            .classed( 'note-title', true )
            .text( () => this.renderWidgetTitle() );

        let icons = header
            .append( 'div' )
            .classed( 'note-actions', true );
    }

    createTextField() {
        this.note
            .append( 'div' )
            .classed( 'field contain', true )
            .append( 'textarea' )
            .attr( 'readonly', 'readonly' )
            .text( this.data.note );
    }

    renderWidgetTitle() {
        if ( this.isNew ){
            return 'New Comment';
        }

        let date          = new Date( this.data.modifiedAt ).toLocaleString(),
            createByEmail = 'anonymous',
            uid           = this.data.modifiedBy ? this.data.modifiedBy : this.data.userId;

        if ( uid && uid > -1 ) {
            createByEmail = Hoot.config.users[ uid ].email;
        }

        return `User ${ createByEmail } commented at ${ date }`;
    }
}
