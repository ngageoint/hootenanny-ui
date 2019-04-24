/*******************************************************************************************************
 * File: modifyDataset.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/30/18
 *******************************************************************************************************/

import _find    from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _get     from 'lodash-es/get';
import _map     from 'lodash-es/map';

import FormFactory           from '../../tools/formFactory';
import { modifyDatasetForm } from '../../config/domMetadata';

export default class ModifyDataset {
    constructor( datasets ) {
        this.formType   = datasets.length === 1 ? 'single' : 'multi';
        this.datasets   = datasets.length === 1 ? datasets[ 0 ] : datasets;
        this.folderList = Hoot.folders._folders;
        this.form       = modifyDatasetForm.call( this );
    }

    render() {
        // remove layer name input
        this.form.splice( 3, 1 );

        let formTitle;

        if ( this.formType === 'single' ) {
            formTitle = 'Modify Dataset';

            this.pathName = _get( _find( this.folderList, folder => folder.id === this.datasets.folderId ), 'path' ) || 'root';
        } else {
            formTitle = 'Move Datasets';

            let set = d3.set();

            _forEach( this.datasets, dataset => {
                if ( !set.has( dataset.folderId ) ) {
                    set.add( dataset.folderId );
                }
            } );

            let folderIds = set.values();

            if ( folderIds.length > 1 ) {
                this.pathName = 'root';
            } else {
                let folderId  = parseInt( folderIds[ 0 ], 10 );
                this.pathName = _get( _find( this.folderList, folder => folder.id === folderId ), 'path' ) || 'root';
            }

            this.form.splice( 0, 1 );
        }

        let metadata = {
            title: formTitle,
            form: this.form,
            button: {
                text: 'Modify',
                location: 'right',
                id: 'modifySubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'modify-dataset-form', metadata );

        this.layerNameInput     = this.container.select( '#modifyName' );
        this.pathNameInput      = this.container.select( '#modifyPathName' );
        this.newFolderNameInput = this.container.select( '#modifyNewFolderName' );
        this.submitButton       = this.container.select( '#modifySubmitBtn' );

        if ( this.formType === 'single' ) {
            this.layerNameInput.property( 'value', this.datasets.name );
        }

        this.pathNameInput.property( 'value', this.pathName );
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

        if ( reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
            valid = false;
        }

        if ( d.id === 'modifyName' && !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );

        if ( this.container.selectAll( '.text-input.invalid' ).size() > 0 ) {
            valid = false;
        }

        this.submitButton.node().disabled = !valid;
    }

    async handleSubmit() {
        let pathName      = this.pathNameInput.property( 'value' ),
            newFolderName = this.newFolderNameInput.property( 'value' ),
            layerName     = this.formType === 'single' ? this.layerNameInput.property( 'value' ) : null,
            pathId        = _get( _find( Hoot.folders._folders, folder => folder.path === pathName ), 'id' ) || 0;

        if ( !newFolderName && layerName ) {
            // make sure another layer with the same name doesn't exist at specified path
            if ( layerName !== this.datasets.name && Hoot.layers.exists( layerName, pathId ) ) {
                let message = 'A layer already exists with this name in the destination folder. Please remove the old layer or select a new name for this layer.',
                    type    = 'warn';

                Hoot.message.alert( { message, type } );
                return false;
            }
        } else {
            // make sure another folder with the same name doesn't exist at specified path
            if ( Hoot.folders.exists( newFolderName, pathId ) ) {
                let message = 'A folder already exists with this name in the destination path. Please remove the old folder or select a new name for this folder.',
                    type    = 'warn';

                Hoot.message.alert( { message, type } );
                return false;
            }
        }

        let folderId;

        if ( newFolderName ) {
            folderId = (await Hoot.folders.addFolder( pathName, newFolderName )).folderId;
        } else {
            folderId = pathId;
        }

        if ( this.formType === 'single' ) {
            let params = {
                mapId: this.datasets.id,
                inputType: this.datasets.type,
                modName: layerName
            };

            this.processRequest = Hoot.api.modify( params )
                .then( () => Hoot.layers.refreshLayers() )
                .then( () => Hoot.folders.updateFolderLink( layerName, folderId ) )
                .then( () => Hoot.folders.refreshAll() )
                .then( () => Hoot.events.emit( 'render-dataset-table' ) )
                .then( () => {
                    let type = 'success',
                        message;

                    if ( layerName !== this.datasets.name && pathName !== this.pathName ) {
                        message = 'Successfully moved and renamed dataset';
                    } else if ( layerName !== this.datasets.name ) {
                        message = 'Successfully renamed dataset';
                    } else {
                        message = 'Successfully moved dataset';
                    }

                    Hoot.message.alert( { message, type } );
                } )
                .catch( () => {
                    let message = 'Error modifying datasets!',
                        type    = 'error';

                    Hoot.message.alert( { message, type } );
                } )
                .finally( () => {
                    this.container.remove();
                    Hoot.events.emit( 'modal-closed' );
                } );
        } else {
            this.processRequest = Promise.all( _map( this.datasets, dataset => Hoot.folders.updateFolderLink( dataset.name, folderId ) ) )
                .then( () => Hoot.folders.refreshAll() )
                .then( () => Hoot.events.emit( 'render-dataset-table' ) )
                .then( () => {
                    let message = 'Successfully moved all datasets',
                        type    = 'success';

                    Hoot.message.alert( { message, type } );
                } )
                .catch( () => {
                    let message = 'Error performing move! Please make sure the selected folder path exists.',
                        type    = 'error';

                    Hoot.message.alert( { message, type } );
                } )
                .finally( () => {
                    this.container.remove();
                    Hoot.events.emit( 'modal-closed' );
                } );
        }
    }
}
