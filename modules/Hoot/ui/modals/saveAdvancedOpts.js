import FormFactory        from '../../tools/formFactory';
import { saveAdvancedOpts} from '../../config/domMetadata';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class SaveAdvancedOpts {
    constructor( opts ) {
        this.saveOpts     = saveAdvancedOpts.call( this );
        this.currentFavs  = opts;
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

            reservedWords    = [ 'root', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        this.currentFavs.forEach( function(n) { reservedWords.push(n); });

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

    sortCombobox( defaultTypes,  userFavorites  ) {

        let favorites = [];

        Object.keys( userFavorites ).map( fav => favorites.push( fav ) );

        favorites.sort();

        favorites.forEach( opt => defaultTypes.push( opt ) );

        return defaultTypes;

    }

    populateCombobox( input ) {

        let newCombo = new FormFactory();

        let element = d3.select( '#conflateType' );

        element.datum().data = input;

        newCombo.populateCombobox( element );
    }

    handleSubmit() {
        let favoriteName = this.folderNameInput.property( 'value' );
        let confType = d3.select('#conflateType').property('value');

        let opts = {
            name: favoriteName,
            members: {
                members: this.saveOpts[0].data,
                name: favoriteName,
                label: favoriteName,
                conflateType: confType

            }
        };

        this.processRequest = Hoot.api.saveFavoriteOpts( opts )
            .then( () => Hoot.getAllUsers() )
            .then( async () => {

                let getTypes = await Hoot.api.getConflateTypes(true);

                let getFavorites = Hoot.config.users[Hoot.user().id].members;

                let allConfTypes = this.sortCombobox( getTypes, getFavorites );

                this.populateCombobox( allConfTypes );
            } )
            .catch( err => {
                let alert = {
                    message: err,
                    type: 'warn'
                };

                Hoot.message.alert( alert );

            } )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );

                Hoot.message.alert( {
                    message: 'Fav. Opts Saved Successfully',
                    type: 'success'
                } );
            } );
    }
}
