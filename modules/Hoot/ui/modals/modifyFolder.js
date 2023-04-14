/*******************************************************************************************************
 * File: modifyFolder.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/31/18
 *******************************************************************************************************/

import _find from 'lodash-es/find';
import _get  from 'lodash-es/get';

import FormFactory             from '../../tools/formFactory';
import { modifyDatasetForm }   from '../../config/domMetadata';
import { unallowableWordsExist } from '../../tools/utilities';
import { select as d3_select } from 'd3-selection';

export default class ModifyFolder {
    constructor( d ) {
        this.data = d;

        let descendents = this.getDescendents(d.map(f => f.id), Hoot.folders.folderPaths);
        let parents = [...new Set(d.map(f => f.parentId))];

        //filter out the folder itself
        //and all of it's descendents
        this.folderList = [
            {
                path : '/',
                id : 0,
                name: 'root',
                userId: Hoot.user().id //hack to make root always visible to user
            }
        ].concat(Hoot.folders.folderPaths)
        .filter(f => {
            return !descendents.includes(f.id) && !parents.includes(f.id);
        });

        this.form = modifyDatasetForm.call( this );
    }

    //get list of folder ids and all their descendents
    getDescendents(ids, folders) {

        let children = folders.filter(f => ids.includes(f.parentId))
                          .map(f => f.id);

        if (children.length) {
            return [...new Set(ids.concat(children).concat(this.getDescendents(children, folders)))];
        } else {
            return ids;
        }
    }


    render() {
        // remove new folder input
        this.form.splice( 2, 1 );
        this.pathName = _get( _find( this.folderList, folder => folder.id === this.data.parentId ), 'path' );

        if ( this.data.length > 1 ) this.form[0].hidden = true; // hide folder name input for multi folder selection


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

        this.folderNameInput       = this.container.select( '#modifyName' );
        this.pathNameInput         = this.container.select( '#modifyPathName' );
        this.folderVisibilityInput = this.container.select( '#modifyVisibility' );
        this.submitButton          = this.container.select( '#modifySubmitBtn' );

        this.folderNameInput.property( 'value', this.data[0].name );
        this.pathNameInput.property( 'value', this.pathName );
        this.folderVisibilityInput.property( 'checked', this.calcVisibility() );
        this.submitButton.node().disabled = false;

        return this;
    }

    validateTextInput( d ) {
        let target           = d3_select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            unallowedPattern = new RegExp( /[~`#$%\^&*+=\[\]\\';/!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( !str.length ||
            unallowableWordsExist( str ) ||
            unallowedPattern.test( str ) ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );

        if ( this.container.selectAll( '.text-input.invalid' ).size() > 0 ) {
            valid = false;
        }

        this.submitButton.node().disabled = !valid;
    }

    /**
     * checks all the folders in the list (move operation will be multiple folders while modife is only 1)
     * if all folders are public it will return true, else returns false (even if all are public but 1 selected isn't)
     * @returns {boolean}
     */
    calcVisibility() {
        let allPublic = true;

        this.data.forEach( data => {
            allPublic = (allPublic && data.public);
        } );

        return allPublic;
    }

    async handleSubmit() {
        let folderName = this.folderNameInput.property( 'value' ),
            pathName   = this.pathNameInput.property( 'value' ),
            isPublic   = this.folderVisibilityInput.property( 'checked' ),
            folderId   = _get( _find( Hoot.folders.folderPaths, folder => folder.path === pathName ), 'id' ) || 0;

        // We do this because if user only changes visibility
        if ( ( folderName !== this.data.name || pathName !== this.pathName ) &&
            Hoot.folders.exists( folderName, folderId ) &&
            this.calcVisibility() === isPublic) {
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
        let visibilityParamsList = [];
        let message;

        this.data.forEach( function(folder) {
            let modParams = {
                mapId: folder.id,
                inputType: folder.type,
                modName: folderName
            };

            let updateParams = {
                folderId: folder.id,
                parentId: folderId
            };

            let visibilityParams = {
                folderId: folder.id,
                visibility: (isPublic) ? 'public' : 'private'
            };

            message = 'Successfully ';

            if ( folderName !== folder.name ) {
                requests.push( Hoot.api.modify( modParams ) );
                message += 'renamed folder';
            }
            if ( pathName !== '' && pathName !== folder.path ) {
                requests.push( Hoot.api.updateFolder( updateParams ) );
                if (message.substr(-1) !== ' ') message += ' & ';
                message += 'moved folder';
            }

            if ( folder.public !== isPublic ) {
                visibilityParamsList.push( visibilityParams );
                if (message.substr(-1) !== ' ') message += ' & ';
                message += `changed visibility to ${ visibilityParams.visibility }`;
            }

        } );

        this.processRequest = Promise.all(requests)//rate limit?
            .then( () => {
                let visibilityRequests = [];
                visibilityParamsList.forEach( params => {
                    visibilityRequests.push( Hoot.api.updateVisibility( params ) );
                } );

                return Promise.all(visibilityRequests);
            })
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
