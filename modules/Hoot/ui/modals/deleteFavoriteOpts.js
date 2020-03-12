import FormFactory   from '../../tools/formFactory';
import AdvancedOpts  from '../../ui/sidebar/advancedOpts';
import { deleteFavoriteOpts} from '../../config/domMetadata';
import _find    from 'lodash-es/find';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class DeleteFavoriteOpts {
    constructor() {
        this.favorites  = this.getAllFavorites();
    }

    render() {

        this.deleteOpts = deleteFavoriteOpts.call( this );

        let optCheck = this.favorites.map( a => a.name );

        this.deleteOpts[ 0 ].data = optCheck;

        let metadata = {
            title: 'Delete Favorite Adv. Opts',
            form: this.deleteOpts,
            button: {
                text: 'Delete',
                location: 'right',
                id: 'addSubmitBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'datasets-import-form', metadata );

        this.typeInput      = this.container.select( '#optToDelete' );
        this.submitButton   = this.container.select( '#addSubmitBtn' );

        return this;
    }

    /**
     * Validate user input to make sure it doesn't
     * contain un-allowed characters and isn't an empty string
     *
     * @param d - node data
     */
    validateTextInput( d ) {
        let target           = d3.select( `#${ d.id }` ),
            node             = target.node(),
            str              = node.value,

            reservedWords    = [ 'root', 'dataset', 'folder' ],
            unallowedPattern = new RegExp( /[~`#$%\^&*+=\-\[\]\\';\./!,/{}|\\":<>\?|]/g ),
            valid            = true;

        if ( reservedWords.indexOf( str.toLowerCase() ) > -1 || unallowedPattern.test( str ) ) {
            valid = false;
        }

        if ( d.required && !str.length ) {
            valid = false;
        }

        target.classed( 'invalid', !valid );
        this.formValid = valid;
        this.updateButtonState();
    }

    /**
     * Update the form by enabling, disabling, or clearing certain
     * fields based on the value entered
     */
    handleTypeChange() {
        let selectedVal  = this.typeInput.property( 'value' ),
            selectedType = this.getTypeName( selectedVal );

        // enable input
        this.submitButton.node().disabled = !selectedType;
    }

    /**
     * Enable/disable button based on form validity
     */
    updateButtonState() {
        let importType = this.typeInput.node().value,
            self       = this;

        this.container.selectAll( '.text-input' )
            .each( function() {
                let classes = d3.select( this ).attr( 'class' ).split( ' ' );

                if ( classes.indexOf( 'invalid' ) > -1 || !importType.length ) {
                    self.formValid = false;
                }
            } );

        this.submitButton.node().disabled = !this.formValid;
    }

    /**
     * Get the selected import-type's value
     *
     * @param title - title of selected import-type
     * @returns {boolean|string} - value of type if found. otherwise, false.
     */
    getTypeName( title ) {
        let allOpts = this.favorites,
            match   = _find( allOpts, o => o.name === title );

        return match.name ? match.name : false;
    }

    getAllFavorites() {

        Hoot.api.getAllUsers();

        let currentFavorites = [];

        let allFavorites = Hoot.config.users[Hoot.user().id].members;

        let parseFavorites =
            Object.keys(allFavorites)
                .forEach( function(key) {
                    currentFavorites.push( JSON.parse( allFavorites[key] ) );
                } );

        currentFavorites.sort(function(a, b){
            var x = a.name;
            var y = b.name;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });

        return currentFavorites;
    }

    sortCombobox( defaultTypes,  userFavorites  ) {

        let favorites = [];

        Object.keys( userFavorites ).map( fav => favorites.push( fav ) );

        favorites.sort();

        favorites.forEach( opt => defaultTypes.push( opt ) );

        return defaultTypes;

    }

    populateCombobox( type, input ) {

        let newCombo = new FormFactory();

        if ( type === 'delete' ) {
            let deleteModal = d3.select( '#optToDelete' );

            deleteModal.datum().data = input;

            newCombo.populateCombobox( deleteModal );
        }
        else {
            let element = d3.select( '#conflateType' );

            element.datum().data = input;

            newCombo.populateCombobox( element );
        }
    }

    handleSubmit() {
        let optName = this.typeInput.property( 'value' );

        let toDelete = _find( this.favorites, o => o.name === optName );

        this.processRequest = Hoot.api.deleteFavoriteOpts( toDelete )
            .then( () => Hoot.getAllUsers() )
            .then( async ()  => {
                let getOpts = AdvancedOpts.getInstance();
                let advOpts = getOpts.advancedOptions;

                getOpts.createGroups(advOpts);

                d3.select('#updateFav').classed('hidden', true );

                let getTypes = await Hoot.api.getConflateTypes(true);

                let getFavorites = Hoot.config.users[Hoot.user().id].members;

                let allConfTypes = this.sortCombobox( getTypes, getFavorites );

                this.populateCombobox( 'delete', allConfTypes );

                this.populateCombobox( 'allTypes', allConfTypes );

                d3.select('#conflateType').property('value', 'Reference');
            } )
            .catch( err => {
                Hoot.message.alert( {
                    message: err,
                    type: 'warn'
                } );
            } )
            .finally( () => {
                this.container.remove();
                Hoot.events.emit( 'modal-closed' );

                Hoot.message.alert( {
                    message: 'Fav. Opts Deleted Successfully',
                    type: 'success'
                } );
            } );
    }

}