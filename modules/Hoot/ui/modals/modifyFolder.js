/*******************************************************************************************************
 * File: modifyFolder.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/31/18
 *******************************************************************************************************/

import _find    from 'lodash-es/find';
import _get     from 'lodash-es/get';

import Hoot                  from '../../hoot';
import FormFactory           from '../../tools/formFactory';
import { modifyDatasetForm } from '../../config/domMetadata';

export default class ModifyFolder {
    constructor( d ) {
        this.data       = d;
        this.folderList = Hoot.folders._folders;
        this.form       = modifyDatasetForm.call( this );
    }

    render() {
        // remove layer name input
        this.form.splice( 2, 1 );
        this.pathName = _get( _find( this.folderList, folder => folder.id === this.data.parentId ), 'path' ) || 'root';

        let metadata = {
            title: 'Modify Folder',
            form: this.form,
            button: {
                text: 'Modify',
                location: 'right',
                id: 'modifySubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'modify-folder-form', metadata );

        this.nameInput     = this.container.select( '#modifyName' );
        this.pathNameInput = this.container.select( '#modifyPathName' );
        this.submitButton  = this.container.select( '#modifySubmitBtn' );

        this.nameInput.property( 'value', this.data.name );
        this.pathNameInput.property( 'value', this.pathName );
        this.submitButton.node().disabled = false;
    }

    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( !str.length ||
            reservedWords.indexOf( str.toLowerCase() ) > -1 ||
            unallowedPattern.test( str ) ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );

        if ( this.container.selectAll( '.text-input.invalid' ).size() > 0 ) {
            valid = false;
        }

        this.submitButton.node().disabled = !valid;
    }

    async handleSubmit() {
        let folderName = this.nameInput.property( 'value' ),
            pathName   = this.pathNameInput.property( 'value' ),
            folderId   = _get( _find( Hoot.folders._folders, folder => folder.path === pathName ), 'id' );

        if ( Hoot.folders.exists( folderName, folderId ) ) {
            let message = 'A folder already exists with this name in the destination path. Please remove the old folder or select a new name for this folder.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }

        let modParams = {
            mapId: this.data.id,
            inputType: this.data.type,
            modName: folderName
        };

        let updateParams = {
            folderId: this.data.id,
            parentId: folderId
        };

        return Hoot.api.modify( modParams )
            .then( () => Hoot.api.updateFolder( updateParams ) )
            .then( () => Hoot.folders.refreshAll() )
            .then( () => {
                let type = 'success',
                    message;

                if ( folderName !== this.data.name && pathName !== this.pathName ) {
                    message = 'Successfully moved and renamed folder';
                } else if ( folderName !== this.data.name ) {
                    message = 'Successfully renamed folder';
                } else {
                    message = 'Successfully moved folder';
                }

                Hoot.message.alert( { message, type } );
            } )
            .finally( () => this.container.remove() );

    }
}