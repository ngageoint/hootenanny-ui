/*******************************************************************************************************
 * File: modifyFolder.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/31/18
 *******************************************************************************************************/

import _find from 'lodash-es/find';
import _get  from 'lodash-es/get';

import FormFactory           from '../../tools/formFactory';
import { modifyDatasetForm } from '../../config/domMetadata';

export default class ModifyFolder {
    constructor( d ) {
        this.data = d;

        //get list of folder ids and all their descendents
        function getDescendents(ids, folders) {

            let children = folders.filter(f => ids.findIndex( getId => getId.id === f.parentId) !== -1 );

            if (children.length) {
                return [...new Set(ids.concat(children).concat(getDescendents(children, folders)))];
            } else {
                return ids;
            }
        }
        let descendents = getDescendents( d, Hoot.folders._folders);

        //filter out the folder itself
        //and all of it's descendents
        this.folderList = Hoot.folders._folders.filter(f => {
            return !descendents.includes(f.id);
        });

        this.form       = modifyDatasetForm.call( this );
    }

    render() {
        // remove layer name input
        this.form.splice( 2, 1 );

        this.pathName = _get( _find( this.folderList, folder => folder.id === this.data.parentId ), 'path' ) || '/';

        // Because dataset and folder share the same settings we had to set a trigger here to tell the formFactory
        // that we want root in the path dropdown
        const pathComboboxSettings = _find( this.form, formItem => formItem.itemKey === 'path' );
        pathComboboxSettings.includeRoot = true;

        if ( this.data.length > 1 ) {

            this.form.splice( 0, 1 );

            let that = this;

            that = that.folderList.filter( f => this.data.findIndex( folder => folder.parentId === f.id || folder.id === f.id || folder.name === f.name ) === -1 );

            this.form[0].data = that;

        }

        let metadata = {
            title: this.data.length > 1 ? 'Move Folders' : 'Modify Folder',
            form: this.form,
            button: {
                text: 'Modify',
                location: 'right',
                id: 'modifySubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'modify-folder-form', metadata );

        this.folderNameInput       = this.container.select( '#modifyName' );
        this.pathNameInput         = this.container.select( '#modifyPathName' );
        this.folderVisibilityInput = this.container.select( '#modifyVisibility' );
        this.submitButton          = this.container.select( '#modifySubmitBtn' );

        this.folderNameInput.property( 'value', this.data.name );
        this.pathNameInput.property( 'value', this.pathName );
        this.folderVisibilityInput.property( 'checked', this.data.public );
        this.submitButton.node().disabled = false;

        return this;
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
        let folderName = this.folderNameInput.node() ? this.folderNameInput.property( 'value' ) : '',
            pathName   = this.pathNameInput.property( 'value' ),
            isPublic   = this.folderVisibilityInput.property( 'checked' ),
            folderId   = _get( _find( Hoot.folders._folders, folder => folder.path === pathName ), 'id' ) || 0;

        // We do this because if user only changes visibility
        if ( ( folderName !== this.data.name || pathName !== this.pathName ) && Hoot.folders.exists( folderName, folderId ) ) {
            let message = 'A folder already exists with this name in the destination path. Please remove the old folder or select a new name for this folder.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        } else if ( folderId === this.data.id ) {
            let message = 'The new parent folder cannot be the current folder. Please select a different folder.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }

        let requests = [];
        let message;

        this.data.forEach( function(folder) {
            let modMultiParams = {
                mapId: folder.id,
                inputType: folder.type,
                modName: folder.name
            };

            let updateMultiParams = {
                folderId: folder.id,
                parentId: folderId
            };

            let multiVisibilityParams = {
                folderId: folder.id,
                visibility: (isPublic) ? 'public' : 'private'
            };

            message = 'Successfully ';

            if ( folderName !== folder.name ) {
                requests.push( Hoot.api.modify( modMultiParams ) );
                message += 'renamed folder';
            }
            if ( pathName !== folder.path ) {
                requests.push( Hoot.api.updateFolder( updateMultiParams ) );
                if (message.substr(-1) !== ' ') message += ' & ';
                message += 'moved folder';
            }
            if ( folder.public !== isPublic ) {
                requests.push( Hoot.api.updateVisibility( multiVisibilityParams ) );
                if (message.substr(-1) !== ' ') message += ' & ';
                message += `changed visibility to ${ multiVisibilityParams.visibility }`;
            }

        } );

        this.processRequest = Promise.all(requests)
            .then( () => Hoot.folders.refreshAll() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .then( () => {
                let type = 'success';
                Hoot.message.alert( { message, type } );
            } )
            .catch( (err) => {
                Hoot.message.alert( err );
            })
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );

    }
}
