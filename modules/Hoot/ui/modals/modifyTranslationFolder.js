import _find from 'lodash-es/find';
import _get  from 'lodash-es/get';

import FormFactory           from '../../tools/formFactory';

export default class ModifyTranslationFolder {
    constructor( translationFolder ) {
        this.translationFolder = translationFolder;
        this.translationFoldersList = Hoot.folders.translationFolders;

        let descendents = this.getDescendents([ this.translationFolder.id ], this.translationFoldersList);

        //filter out the folder itself and all of it's descendents
        this.folderList = [
            {
                path : '/',
                id : 0,
                name: 'root',
                userId: Hoot.user().id //hack to make root always visible to user
            }
        ].concat(Hoot.folders.translationFolders)
            .filter(f => {
                return !descendents.includes(f.id) && this.translationFolder.parentId !== f.id;
            });

        this.form = [
            {
                label: 'Move to Existing Folder',
                id: 'modifyPathName',
                class: 'path-name',
                inputType: 'combobox',
                placeholder: 'Select a path',
                data: this.folderList,
                readonly: 'readonly',
                sort: true,
                itemKey: 'path'
            },
            {
                label: 'Public',
                id: 'modifyVisibility',
                inputType: 'checkbox',
                value: 'Public',
                checked: false,
                class: 'folder-checkbox'
            }
        ];
    }

    //get list of folder ids and all their descendents
    getDescendents(ids, folders) {

        let children = folders.filter(f => ids.includes(f.parentId))
            .map(f => f.id);

        if (children.length) {
            return [...new Set(ids.concat( children ).concat(this.getDescendents(children, folders)))];
        } else {
            return [ ids ];
        }
    }


    render() {
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

        this.pathNameInput         = this.container.select( '#modifyPathName' );
        this.folderVisibilityInput = this.container.select( '#modifyVisibility' );
        this.submitButton          = this.container.select( '#modifySubmitBtn' );

        this.pathNameInput.property( 'value', this.translationFolder.path );
        this.folderVisibilityInput.property( 'checked', this.translationFolder.public );
        this.submitButton.node().disabled = false;

        return this;
    }

    async handleSubmit() {
        let folderName         = this.translationFolder.name,
            pathName           = this.pathNameInput.property( 'value' ),
            isPublic           = this.folderVisibilityInput.property( 'checked' ),
            folderId           = _get( _find( this.translationFoldersList, folder => folder.path === pathName ), 'id' ) || 0,
            targetFolderExists = _find( Hoot.folders.translationFolders, folder => folder.id === folderId && folder.name === folderName );

        if ( pathName !== this.translationFolder.path && targetFolderExists) {
            let message = 'A folder already exists with this name in the destination path. Please remove the old folder or select a new name for this folder.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        } else if ( folderId === this.translationFolder.id && this.translationFolder.public === isPublic ) {
            let message = 'The new parent folder cannot be the current folder. Please select a different folder.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }

        let message;
        let moveRequest = [];

        message = 'Successfully ';
        if ( pathName !== '' && pathName !== this.translationFolder.path ) {
            let updateParams = {
                folderId: this.translationFolder.id,
                targetFolderId: folderId
            };

            moveRequest.push( Hoot.api.moveTranslationFolder( updateParams ) );
            message += 'moved folder';
        }

        this.processRequest = Promise.all(moveRequest)
            .then( () => {
                let visibilityRequest = [];

                if ( this.translationFolder.public !== isPublic ) {
                    let visibilityParams = {
                        folderId: this.translationFolder.id,
                        visibility: (isPublic) ? 'public' : 'private'
                    };

                    visibilityRequest.push( Hoot.api.changeTranslationVisibility( visibilityParams ) );
                    if (message.substr(-1) !== ' ') message += ' & ';
                    message += `changed visibility to ${ visibilityParams.visibility }`;
                }

                return Promise.all(visibilityRequest);
            })
            .then( () => Hoot.folders.refreshTranslationInfo() )
            .then( () => Hoot.events.emit( 'render-translations-table' ) )
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
