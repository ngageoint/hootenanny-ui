import _find    from 'lodash-es/find';
import _get     from 'lodash-es/get';

import FormFactory           from '../../tools/formFactory';

export default class ModifyTranslation {
    constructor( translation ) {
        this.translation = translation;
        this.folderList  = Hoot.folders.translationFolders;

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
            }
        ];
    }

    render() {
        this.pathName = _get( _find( this.folderList, folder => folder.id === this.translation.folderId ), 'path' );

        let metadata = {
            title: 'Modify Translation',
            form: this.form,
            button: {
                text: 'Modify',
                location: 'right',
                id: 'modifySubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'modify-translation-form', metadata );

        this.pathNameInput      = this.container.select( '#modifyPathName' );
        this.submitButton       = this.container.select( '#modifySubmitBtn' );

        this.pathNameInput.property( 'value', this.pathName );
        this.submitButton.node().disabled = false;

        return this;
    }

    async handleSubmit() {
        let pathName        = this.pathNameInput.property( 'value' ),
            targetFolder    = _get( _find( this.folderList, folder => folder.path === pathName ), 'id' ) || 0,
            translationName = this.translation.name;

        // make sure another layer with the same name doesn't exist at specified path
        if ( targetFolder === this.translation.folderId ) {
            let message = 'Please select a new folder.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }
        else if ( _find( Hoot.folders.translations, translation => translation.folderId === targetFolder && translation.name === translationName ) ) {
            let message = 'A translation already exists with this name in the destination folder. Please remove the old translation and try again.',
                type    = 'warn';

            Hoot.message.alert( { message, type } );
            return false;
        }

        let params = {
            translationId: this.translation.id,
            folderId: targetFolder
        };

        this.processRequest = Hoot.api.moveTranslation( params )
            .then( () => Hoot.folders.refreshTranslationInfo() )
            .then( () => Hoot.events.emit( 'render-translations-table' ) )
            .then( () => {
                let type = 'success',
                    message= 'Successfully moved translation';

                Hoot.message.alert( { message, type } );
            } )
            .catch( (err) => {
                err.message = err.data;
                Hoot.message.alert( err );
            } )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );
    }
}
