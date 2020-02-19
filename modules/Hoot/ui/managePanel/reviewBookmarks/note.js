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
            .classed( 'note fill-white small round', true );

        this.createHeader();
        this.createTextField();
    }

    createHeader() {
        this.note.append( 'div' )
            .classed( 'material-icons user-icon', true )
            .text( 'person' );

        const headerData = this.note
            .append( 'div' )
            .classed( 'note-meta', true );

        headerData.append( 'span' )
            .classed( 'note-user', true )
            .text( () =>  Hoot.config.users[ this.data.userId ].display_name );

        headerData.append( 'span' )
            .classed( 'note-timestamp', true )
            .text( () => {
                return new Date( this.data.modifiedAt ).toLocaleString();
            });

        if ( this.data.userId === Hoot.user().id ) {
            this.note.append( 'div' )
                .classed( 'node-edit material-icons small pointer', true )
                .text( 'edit' )
                .on( 'click', () => {
                    let editNote = new EditBookmarkNote( this.instance, 'edit', this.data );

                    editNote.render();
                } );
        }
    }

    createTextField() {
        let taggedUsers;
        if ( this.data.taggedUsers ) {
            taggedUsers = this.data.taggedUsers.map( userId => `@${ Hoot.config.users[ userId ].display_name }` )
                .join( ', ' );
        }

        let comment;
        if ( taggedUsers ) {
            comment = taggedUsers + '\n' + this.data.note;
        } else {
            comment = this.data.note;
        }

        this.note.append( 'div' )
            .classed( 'field contain', true )
            .text( comment );
    }

    renderTitle() {
        let date = new Date( this.data.modifiedAt ).toLocaleString();

        return `User ${ Hoot.config.users[ this.data.userId ].display_name } commented at ${ date }`;
    }
}
