import FormFactory        from '../../tools/formFactory';
import { saveFavoriteOpt } from '../../config/domMetadata';
import { select as d3_select } from 'd3-selection';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class SaveFavoriteOpt {
    constructor( opts ) {
        this.saveOpt           = saveFavoriteOpt.call( this );
        this.currentFavorites  = this.sortAll( null,  opts );
    }

    render() {
        let metadata = {
            title: 'Save Favorite Adv. Opts',
            form: this.saveOpt,
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
        let target           = d3_select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'folder' ];

            this.currentFavorites.map( name => reservedWords.push(name));

            let unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
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
                let classes = d3_select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 || !folderName.length ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    }

    sortAll( defaultTypes,  userFavorites  ) {

        let favorites = [];

        Object.keys( userFavorites ).map( fav => favorites.push( fav ) );

        favorites.sort();

        if ( defaultTypes ) {
            favorites.forEach( opt => defaultTypes.push( opt ) );

            return defaultTypes;
        }

        else {
            return favorites;
        }
    }

    populateCombobox( input ) {

        let newCombo = new FormFactory();

        let element = d3_select( '#conflateType' );

        element.datum().data = input;

        newCombo.populateCombobox( element );
    }

    handleSubmit() {
        let favoriteName = this.folderNameInput.property( 'value' );
        let confType = d3_select('#conflateType').property('value');

        let opts = {
            name: favoriteName,
            members: {
                members: this.saveOpt[0].data,
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

                let allConfTypes = this.sortAll( getTypes, getFavorites );

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
