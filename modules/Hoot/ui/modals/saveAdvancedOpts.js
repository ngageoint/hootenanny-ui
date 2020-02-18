import FormFactory        from '../../tools/formFactory';
import { saveAdvancedOpts} from '../../config/domMetadata';
import { geoPathHasIntersections } from '../../../geo';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class SaveAdvancedOpts {
    constructor(parentId = 0) {
        this.saveOpts     = saveAdvancedOpts.call( this );
        this.parentId = parentId;
    }

    render() {
        let metadata = {
            title: 'Save Favorite Adv. Opts',
            form: this.saveOpts,
            button: {
                text: 'Add',
                location: 'right',
                id: 'addSubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'save-favorite-opts', metadata );

        this.folderNameInput = this.container.select( '#addFolderName' );
        this.folderVisibilityInput = this.container.select( '#addFolderVisibility' );
        this.submitButton    = this.container.select( '#addSubmitBtn' );

        return this;
    }

    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( !str.length || reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    /**
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        let folderName = this.folderNameInput.node().value,
            self       = this;

        this.container.selectAll( '.text-input' )
            .each( function() {
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 || !folderName.length ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    }

    handleSubmit() {
        let name = this.folderNameInput.property( 'value' );
        let isPublic = this.folderVisibilityInput.property( 'checked' );

        let opts = {
            name: [{name}],
            favorites: this.saveOpts[0].data,
            isPublic: isPublic
        };

        this.processRequest = Hoot.api.saveFavoriteOpts( opts )
            .then( () => Hoot.folders.refreshAll() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .catch( err => {
                // TODO: alert - unable to save favorite adv opts
            } )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );
            } );
    }
}
