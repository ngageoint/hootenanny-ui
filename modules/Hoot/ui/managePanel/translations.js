/** ****************************************************************************************************
 * File: translations.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import { saveAs }               from 'file-saver';
import Tab                      from './tab';
import AddTranslation           from '../modals/addTranslation';
import AddTranslationFolder     from '../modals/addTranslationFolder';
import ModifyTranslation        from '../modals/modifyTranslation';
import ModifyTranslationFolder  from '../modals/modifyTranslationFolder';
import ViewTranslation          from '../modals/viewTranslation';
import FolderTree               from '../../tools/folderTree';
import _map                     from 'lodash-es/map';

/**
 * Creates the translations tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class Translations extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Translations';
        this.id   = 'util-translations';

        this.translationTableHeaders = [
            {
                title: 'Translations',
                width: '9%'
            },
            {
                title: 'Owner',
                width: '9%'
            }
        ];

        this.translationButtons = [
            {
                title: 'Add New Translations',
                icon: 'play_for_work',
                onClick: 'import-translation'
            },
            {
                title: 'Add Folder',
                icon: 'create_new_folder',
                onClick: 'add-translation-folder'
            },
            {
                title: 'Refresh Translations',
                icon: 'refresh',
                onClick: 'refresh-translations'
            },
            {
                title: 'Public Data',
                icon: JSON.parse(Hoot.context.storage( 'publicVisibilityTranslations' )) ? 'visibility' : 'visibility_off',
                iconClass: 'public-visibility',
                onClick: 'toggle-public-visibility'
            }
        ];
    }

    render() {
        super.render();

        this.setupButtons();
        this.createTranslationTable();

        this.loadTranslations();

        this.listen();

        return this;
    }

    setupButtons() {
        this.buttonContainer = this.panelWrapper.append( 'div' )
            .classed( 'translation-buttons flex', true );

        let buttonContainer = this.buttonContainer
            .selectAll( 'button.translation-action-button' )
            .data( this.translationButtons );

        let buttons = buttonContainer.enter()
            .append( 'button' )
            .classed( 'translation-action-button primary text-light flex align-center', true )
            .on( 'click', async item => {
                d3.event.preventDefault();

                switch ( item.onClick ) {
                    case 'import-translation': {
                        new AddTranslation( this ).render();
                        break;
                    }
                    case 'add-translation-folder': {
                        new AddTranslationFolder( this ).render();
                        break;
                    }
                    case 'refresh-translations': {
                        this.loadTranslations();
                        break;
                    }
                    case 'toggle-public-visibility': {
                        let publicVisibilityPref = JSON.parse(Hoot.context.storage( 'publicVisibilityTranslations' ));
                        Hoot.context.storage( 'publicVisibilityTranslations', !publicVisibilityPref);
                        this.buttonContainer.select('i.public-visibility').text(!publicVisibilityPref ? 'visibility' : 'visibility_off');
                        this.loadTranslations();
                        break;
                    }
                }
            } );

        buttons.append( 'i' )
            .attr( 'class', d => d.iconClass )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        buttons.append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );

    }

    createTranslationTable() {
        let table = this.panelWrapper.append( 'div' )
            .attr( 'id', 'translation-table' )
            .classed( 'translation-table keyline-all fill-white', true );

        table.insert( 'div' )
            .attr( 'id', 'translation-table-header' )
            .selectAll( 'th' )
            .data( this.translationTableHeaders )
            .enter().append( 'th' )
            .attr( 'style', d => `width: ${ d.width }` )
            .text( d => d.title );

        this.translationTable = table;
    }

    async loadTranslations() {
        try {
            await Hoot.folders.refreshTranslationInfo();

            if ( !this.folderTree ) {
                this.folderTree = new FolderTree( this.translationTable );
            }

            this.folderTree.render();
        } catch ( e ) {
            throw new Error( e );
        }
    }

    async translationPopup( d ) {
        let translationText;

        if ( d.DEFAULT ) {
            translationText = await Hoot.api.getDefaultTranslation( d.PATH );
        } else {
            translationText = await Hoot.api.getTranslation( d.NAME || d.id );
        }

        new ViewTranslation( this, d, translationText ).render();
    }

    async exportTranslation( d ) {
        try {
            let translationText;

            if ( d.DEFAULT ) {
                translationText = await Hoot.api.getDefaultTranslation( d.PATH );
            } else {
                translationText = await Hoot.api.getTranslation( d.NAME || d.id );
            }

            let transBlob = new Blob( [ translationText ], { type: 'text/javascript' } );
            let name = d.NAME || d.name;
            saveAs( transBlob, name + '.js' );

        } catch ( e ) {
            throw new Error( e );
        }
    }

    deleteItems( toDelete ) {
        return Promise.all( _map( toDelete, item => {
            let data = item.data || item;

            if ( data.type === 'translation' ) {
                return Hoot.api.deleteTranslation( data.id )
                    .catch( ( err ) => {
                        err.message = err.data;
                        delete err.data;
                        Hoot.message.alert( err );
                    });
            } else {
                // children are placed in root of object when folder is open
                let children = item.children || data._children;

                if ( children && children.length ) {
                    return this.deleteItems( children )
                        .then( () => Hoot.api.deleteTranslationFolder( data.id ) )
                        .catch( ( err ) => {
                            err.message = err.data;
                            delete err.data;
                            Hoot.message.alert( err );
                        });
                } else {
                    return Hoot.api.deleteTranslationFolder( data.id )
                        .catch( ( err ) => {
                            err.message = err.data;
                            delete err.data;
                            Hoot.message.alert( err );
                        });
                }
            }
        } ) );
    }

    async handleContextMenuClick( [tree, d, item] ) {
        switch ( item.click ) {
            case 'deleteTranslation': {
                let r = await Hoot.message.confirm('Are you sure you want to delete selected translations?');
                if (!r) return;

                Hoot.api.deleteTranslation( d.data.id || d.data.NAME )
                    .then( () => Hoot.folders.refreshTranslationInfo() )
                    .then( () => this.loadTranslations() );
                break;
            }
            case 'exportTranslation': {
                this.exportTranslation( d.data );
                break;
            }
            case 'viewTranslation': {
                this.translationPopup( d.data );
                break;
            }
            case 'modifyTranslation': {
                this.modifyLayerModal = new ModifyTranslation( d.data ).render();

                Hoot.events.once( 'modal-closed', () => delete this.modifyLayerModal );
                break;
            }
            case 'modifyFolder': {
                this.modifyFolderModal = new ModifyTranslationFolder( d.data ).render();

                Hoot.events.once( 'modal-closed', () => delete this.modifyFolderModal );
                break;
            }
            case 'deleteTranslationFolder': {
                let r = await Hoot.message.confirm('Are you sure you want to delete the selected folder?');
                if (!r) return;

                this.deleteItems( [ d ] )
                    .then( () => Hoot.folders.refreshTranslationInfo() )
                    .then( () => this.loadTranslations() );
                break;
            }
        }
    }

    listen() {
        const className = this.constructor.name;
        Hoot.events.listen( className, 'render-translations-table', () => this.loadTranslations() );
        Hoot.events.listen( className, 'translation-context-menu', ( ...params ) => this.handleContextMenuClick( params ) );
    }
}
