/** ****************************************************************************************************
 * File: note.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/1/18
 *******************************************************************************************************/

import EditBookmarkNote from '../../modals/editBookmarkNote';

export default class Note {
    constructor( instance, notesBody ) {
        this.instance  = instance;
        this.notesBody = notesBody;
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
            .text( () => this.renderTitle() );

        header
            .append( 'div' )
            .classed( 'material-icons small pointer', true )
            .text( 'edit' )
            .on( 'click', () => {
                let editNote = new EditBookmarkNote( this.instance, 'edit', this.data );

                editNote.render();
            } );
    }

    createTextField() {
        this.note
            .append( 'div' )
            .classed( 'field contain', true )
            .append( 'textarea' )
            .attr( 'readonly', 'readonly' )
            .text( this.data.note );
    }

    renderTitle() {
        let date          = new Date( this.data.modifiedAt ).toLocaleString(),
            createByEmail = 'anonymous',
            uid           = this.data.modifiedBy ? this.data.modifiedBy : this.data.userId;

        if ( uid && uid > -1 ) {
            createByEmail = Hoot.config.users[ uid ].email;
        }

        return `User ${ createByEmail } commented at ${ date }`;
    }
}
