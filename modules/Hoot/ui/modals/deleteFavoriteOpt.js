import FormFactory        from '../../tools/formFactory';
import AdvancedOpts  from '../sidebar/advancedOpts';
import _find    from 'lodash-es/find';
import { select as d3_select } from 'd3-selection';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class DeleteFavoriteOpt {
    constructor() {
        this.favorites = this.getAllFavorites();
        this.optToDelete = d3_select('#conflateType').property('value');
    }

    getAllFavorites() {

        Hoot.api.getAllUsers();

        let currentFavorites = [];

        let allFavorites = Hoot.config.users[Hoot.user().id].members;

        Object.keys(allFavorites)
            .forEach( function(key) {
                currentFavorites.push( JSON.parse( allFavorites[key] ) );
            } );

        currentFavorites.sort(function(a, b){
            const x = a.name,
                  y = b.name;
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

    populateCombobox( input ) {

        let newCombo = new FormFactory();

        let element = d3_select( '#conflateType' );

        element.datum().data = input;

        newCombo.populateCombobox( element );
    }

    handleSubmit() {
        let optName = this.optToDelete;

        let toDelete = _find( this.favorites, o => o.name === optName );

        this.processRequest = Hoot.api.deleteFavoriteOpts( toDelete )
            .then( () => Hoot.getAllUsers() )
            .then( async ()  => {

                d3_select('#conflateType').property('value', 'Reference');

                let getOpts = AdvancedOpts.getInstance();
                let advOpts = getOpts.advancedOptions;

                getOpts.createGroups(advOpts);

                let getTypes = await Hoot.api.getConflateTypes(true);

                let getFavorites = Hoot.config.users[Hoot.user().id].members;

                let allConfTypes = this.sortCombobox( getTypes, getFavorites );

                this.populateCombobox( allConfTypes );

            } )
            .catch( err => {
                Hoot.message.alert( {
                    message: err,
                    type: 'warn'
                } );
            } )
            .finally( () => {

                Hoot.message.alert( {
                    message: 'Fav. Opts Deleted Successfully',
                    type: 'success'
                } );

                d3_select('#updateFav').classed('hidden', true );
                d3_select('#deleteFav').classed( 'hidden', true );

            } );
    }

}
