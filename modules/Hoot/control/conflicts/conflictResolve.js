/*******************************************************************************************************
 * File: conflictResolve.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/24/18
 *******************************************************************************************************/

//import _ from 'lodash-es';
import { modeSave } from '../../../modes/save';

export default class ConflictResolve {
    constructor( instance ) {
        this.instance = instance;
        this.context  = instance.context;
        this.data     = instance.data;
    }

    retainFeature() {
        let reviewItem = this.data.currentReviewItem,
            relation   = this.data.currentRelation;

        if ( reviewItem ) {
            if ( relation ) {
                for ( let i = 0; i < relation.members.length; i++ ) {
                    let key = i + 1;

                    d3.selectAll( `.review-feature${ key }` )
                        .classed( `highlight review-feature${ key }`, false );
                }

                this.instance.info.tableContainer.remove();
            } else {
                this.instance.info.tableContainer.remove();
            }

            let hasChanges = this.context.history().hasChanges();

            if ( hasChanges ) {
                this.context.enter( modeSave( this.context ) );
                //modeSave( this.context ).save( () => {
                //    this.instance.traverse.jumpTo( 'forward' );
                //} );
            }
        } else {
            // TODO: alert nothing to review
        }
    }

    acceptAll() {

    }
}