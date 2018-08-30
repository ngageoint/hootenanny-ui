/*******************************************************************************************************
 * File: modifyDatasetFolder.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 8/30/18
 *******************************************************************************************************/

import _find from 'lodash-es/find';
import _filter from 'lodash-es/filter';
import _get  from 'lodash-es/get';
import _forEach from 'lodash-es/forEach';

import Hoot                  from '../../hoot';
import FormFactory           from '../../tools/formFactory';
import { modifyDatasetForm } from '../../config/domMetadata';

export default class ModifyDatasetFolder {
    constructor( datasets ) {
        this.datasets   = datasets.length === 1 ? datasets[ 0 ] : datasets;
        this.folderList = Hoot.folders._folders;
        this.form       = modifyDatasetForm.call( this );
    }

    render() {
        if ( this.datasets.length > 1 ) {
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
                let folderId = parseInt( folderIds[ 0 ], 10 );
                this.pathName = _get( _find( this.folderList, folder => folder.id === folderId ), 'path' ) || 'root';
            }

            this.form.splice( 0, 1 );
        } else {
            this.pathName = _get( _find( this.folderList, folder => folder.id === this.datasets.folderId ), 'path' ) || 'root';
        }

        let metadata = {
            title: 'Modify Dataset',
            form: this.form,
            button: {
                text: 'Modify',
                location: 'right',
                id: 'modifySubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'modify-dataset-form', metadata );

        this.layerNameInput = this.container.select( '#modifyLayerName' );
        this.pathNameInput  = this.container.select( '#modifyPathName' );
        this.submitButton   = this.container.select( '#modifySubmitBtn' );

        this.pathNameInput.property( 'value', this.pathName );
        this.layerNameInput.property( 'value', this.datasets.name );
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
        this.submitButton.node().disabled = !valid;

        if ( str === this.datasets.name ) {
            this.submitButton.node().disabled = true;
        }
    }

    handleSubmit() {
        let layerName = this.layerNameInput.property( 'value' );

        let params = {
            mapId: this.datasets.id,
            inputType: this.datasets.type,
            modName: layerName
        };

        Hoot.api.modifyDataset( params )
            .then( resp => Hoot.message.alert( resp ) )
            .then( () => Hoot.folders.refreshDatasets() )
            .then( () => Hoot.folders.updateFolders( this.container ) )
            .finally( () => this.container.remove() );
    }
}