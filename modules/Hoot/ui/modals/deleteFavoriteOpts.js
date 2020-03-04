import FormFactory   from '../../tools/formFactory';
import AdvancedOpts  from '../../ui/sidebar/advancedOpts';
import Sidebar       from '../../ui/sidebar/sidebar';
import { deleteFavoriteOpts} from '../../config/domMetadata';
import _find    from 'lodash-es/find';
import LayerConflate from '../sidebar/layerConflate';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class DeleteFavoriteOpts {
    constructor( opts ) {
        this.favorites  = opts;
    }

    render() {

        this.deleteOpts = deleteFavoriteOpts.call( this );

        let optCheck = [];

        this.favorites.forEach(function(a) {
            optCheck.push( a.name );
        });

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

    handleSubmit() {
        let optName = this.typeInput.property( 'value' );

        let toDelete = _find( this.favorites, o => o.name === optName );

        this.processRequest = Hoot.api.deleteFavoriteOpts( toDelete )
            .then( () => Hoot.getAllUsers() )
            .then( async ()  => {
                let getOpts = AdvancedOpts.getInstance();
                let advOpts = getOpts.advancedOptions;
                getOpts.createGroups(advOpts);
                let currentFavorites = [];
                let getFavs = Object.keys(Hoot.config.users[Hoot.user().id].members)
                     .forEach( function(o) { currentFavorites.push(o); } );

                let deleteModal = d3.select( '#optToDelete' );

                deleteModal.datum().data = currentFavorites;

                newCombo.populateCombobox( deleteModal, true );

                let getTypes = await Hoot.api.getConflateTypes(true);

                getTypes.forEach( function(f) {
                    currentFavorites.push( f );
                });

                let element = d3.select( '#conflateType' );

                element.datum().data = currentFavorites;

                let newCombo = new FormFactory();

                newCombo.populateCombobox( element, true );

                d3.select('#conflateType').property('value', 'Reference');
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

                let alert = {
                    message: 'Fav. Opt Deleted Successfully',
                    type: 'success'
                };

                Hoot.message.alert({alert});
            } );
    }

}