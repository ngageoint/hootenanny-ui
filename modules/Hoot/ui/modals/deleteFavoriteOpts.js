import AdvancedOpts  from '../../ui/sidebar/advancedOpts';
import _find    from 'lodash-es/find';

/**
 * Form that allows user to import datasets into hoot
 *
 * @param translations - All translations from database
 * @constructor
 */
export default class DeleteFavoriteOpts {
    constructor() {
        this.favorites = this.getAllFavorites();
        this.optToDelete = d3.select('#conflateType').property('value');
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

    handleSubmit() {
        let optName = this.optToDelete;

        let toDelete = _find( this.favorites, o => o.name === optName );

        this.processRequest = Hoot.api.deleteFavoriteOpts( toDelete )
            .then( () => Hoot.getAllUsers() )
            .then( async ()  => {
                let getOpts = AdvancedOpts.getInstance();
                let advOpts = getOpts.advancedOptions;

                getOpts.createGroups(advOpts);

                d3.select('#conflateType').property('value', 'Reference');
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

                d3.select('#updateFav').classed('hidden', true );
                d3.select('#deleteFav').classed( 'hidden', true );

            } );
    }

}