/** ****************************************************************************************************
 * File: translations.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab                  from './tab';
import AddTranslation       from '../modals/addTranslation';
import AddTranslationFolder from '../modals/addTranslationFolder';
import ViewTranslation      from '../modals/viewTranslation';
import { saveAs }           from 'file-saver';
import FolderTree from '../../tools/folderTree';

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
    }

    render() {
        super.render();

        this.createNewTranslationButton();
        this.addTranslationFolder();
        this.createTranslationTable();

        this.loadTranslations();

        this.listen();

        return this;
    }

    createNewTranslationButton() {
        this.panelWrapper
            .append( 'button' )
            .classed( 'add-translation-button button primary _icon big light plus', true )
            .text( 'Add New Translations' )
            .on( 'click', () => new AddTranslation( this ).render() );
    }

    addTranslationFolder() {
        this.panelWrapper
            .append( 'button' )
            .classed( 'add-translation-folder button primary _icon big light plus', true )
            .text( 'Create Folder' )
            .on( 'click', () => new AddTranslationFolder().render() );
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

    renderFolderTree() {
        if ( !this.folderTree ) {
            this.folderTree = new FolderTree( this.translationTable );
        }

        this.folderTree.render();
    }

    async loadTranslations() {
        try {
            this.renderFolderTree();
        } catch ( e ) {
            // TODO: show alert
            // window.console.log( 'Unable to retrieve translations' );
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
            //TODO: show warning
            // window.console.log( 'Unable to get translations text' );
            throw new Error( e );
        }
    }

    async handleContextMenuClick( [tree, d, item] ) {
        switch ( item.click ) {
            case 'deleteTranslation': {
                let r = await Hoot.message.confirm('Are you sure you want to delete selected translations?');
                if (!r) return;

                Hoot.api.deleteTranslation( d.data.id || d.data.NAME )
                    .then( () => Hoot.folders.refreshTranslationInfo() )
                    .then( () => Hoot.events.emit( 'render-translations-table' ) );
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
        }
    }

    listen() {
        const className = this.constructor.name;
        Hoot.events.listen( className, 'render-translations-table', () => this.renderFolderTree() );
        Hoot.events.listen( className, 'translation-context-menu', ( ...params ) => this.handleContextMenuClick( params ) );
    }
}
