/*******************************************************************************************************
 * File: merge.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/16/18
 *******************************************************************************************************/

import _clone   from 'lodash-es/clone';
import _cloneDeep   from 'lodash-es/cloneDeep';
import _find    from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _reduce  from 'lodash-es/reduce';
import _uniq    from 'lodash-es/uniq';

import { JXON }             from '../../../util/jxon';
import { t }                from '../../../core/localizer';
import { operationDelete }  from '../../../operations/delete';
import { actionChangeTags } from '../../../actions/index';
import { uiFlash } from '../../../ui';
import { geoCentroid as d3_geoCetroid } from 'd3-geo';
import { select as d3_select } from 'd3-selection';

/**
 * @class Merge
 */
export default class Merge {
    /**
     * @param instance - conflicts class
     */
    constructor( instance ) {
        this.instance = instance;
        this.data = instance.data;

        this.mergeArrow = {
            from: null,
            to: null
        };

        this.isPoiPoly = false;

        let that = this;
        Hoot.context.history()
            .on('undone.review_merge', function() {
                that.checkMergeButton.call(that);
            });
        Hoot.context.history()
            .on('redone.review_merge', function() {
                that.checkMergeButton.call(that);
            });
    }

    /**
     * Merge together 2 POI nodes or POI and polygon
     *
     * @returns {Promise<void>}
     */
    async mergeFeatures(d3_event) {
        let reverse  = (d3_event.ctrlKey || d3_event.metaKey) && !this.isPoiPoly,
            featureUpdate = _cloneDeep((reverse) ? this.mergeArrow.from : this.mergeArrow.to),
            featureDelete = _cloneDeep((reverse) ? this.mergeArrow.to : this.mergeArrow.from),
            features = [featureUpdate, featureDelete],
            mergedFeature,
            reviewRefs;

        // show merge button
        this.toggleMergeButton( true );

        // This tag identifies the feature that is being merged into and will be removed by the server
        // after merging is completed. The tag is not needed by POI to Polygon conflation, however,
        // and will be ignored since POIs are always merged into polygons.
        featureUpdate.tags[ 'hoot:merge:target' ] = 'yes';

        try {
            let mergedElement = await this.getMergedElement( features );

            mergedElement.tags[ 'hoot:status' ] = 3;

            Hoot.context.perform(
                actionChangeTags( featureUpdate.id, mergedElement.tags ),
                t( 'operations.change_tags.annotation' )
            );

            mergedFeature = featureUpdate; // feature that is updated is now the new merged feature
        } catch ( e ) {
            window.console.error( e );
            let message = 'Unable to merge features' + ((e.data) ? (': ' + e.data) : ''),
                type    = 'error';
            Hoot.message.alert( { message, type } );
            this.checkMergeButton();
            return;
        }

        try {
            let mergeItems              = this.getMergeItems( features ),
                { reviewRefsResponses } = await Hoot.api.getReviewRefs( mergeItems );

            reviewRefs = _uniq( reviewRefsResponses[ 0 ].reviewRefs.concat( reviewRefsResponses[ 1 ].reviewRefs ) );
            reviewRefs = this.removeNonRefs( reviewRefs, [ mergeItems[ 0 ].id, mergeItems[ 1 ].id ] );

            // TODO: get back to this
            // let missingRelationIds = this.getMissingRelationIds( reviewRefs );
        } catch ( e ) {
            let message = 'Unable to retrieve review references for merged items',
                type    = 'error';
            Hoot.message.alert( { message, type } );
            return;
        }

        this.processMerge( reviewRefs, mergedFeature, featureDelete );
    }

    /**
     * Process and finalize the merge by deleting the feature being merged and by updating
     * the tags of both review features and their parent relations to indicate the relations have been resolved.
     *
     * @param reviewRefs - reference of features being merged
     * @param mergedFeature - data of merged element
     * @param featureToDelete - data of feature to delete
     */
    processMerge( reviewRefs, mergedFeature, featureToDelete ) {
        let reviewRelationId = this.data.currentReviewItem.relationId;

        _forEach( reviewRefs, ref => {
            let refRelation    = Hoot.context.hasEntity( `r${ ref.reviewRelationId }_${ this.data.mapId }` ),
                mergedRelation = Hoot.context.hasEntity( `r${ reviewRelationId }_${ this.data.mapId }` );

            if ( refRelation.members.length === mergedRelation.members.length ) {
                let foundCount = 0;

                _forEach( refRelation.members, refMember => {
                    let found = _find( mergedRelation.members, mergedMember => mergedMember.id === refMember.id );

                    if ( found ) {
                        foundCount++;
                    }
                } );

                if ( foundCount === refRelation.members.length ) {
                    refRelation.tags[ 'hoot:review:needs' ] = 'no';

                    Hoot.context.perform(
                        actionChangeTags( refRelation.id, refRelation.tags ),
                        t( 'operations.change_tags.annotation' )
                    );
                }
            }

            let refRelationMember = refRelation.memberById( featureToDelete.id );

            if ( refRelationMember ) {
                let exists = _find( this.data.mergedConflicts, { id: refRelation.id } );

                if ( exists && exists.obj ) {
                    exists = exists.obj.id === mergedFeature.id;
                }

                if ( !exists && !refRelation.memberById( mergedFeature.id ) ) {
                    refRelation.tags[ 'hoot:review:needs' ] = 'no';

                    Hoot.context.perform(
                        actionChangeTags( refRelation.id, refRelation.tags ),
                        t( 'operations.change_tags.annotation' )
                    );
                }
            }
        } );

        let fe = Hoot.context.hasEntity( featureToDelete.id );

        if ( fe ) {
            fe.hootMeta = { 'isReviewDel': true };
        }

        operationDelete( [ featureToDelete.id ], Hoot.context )();
    }

    /**
     * Generate and parse the new merged feature
     *
     * @param features - list of features to merge
     * @returns {object} - merged feature
     */
    async getMergedElement( features ) {
        let jxonFeatures = [ JXON.stringify( features[ 0 ].asJXON() ), JXON.stringify( features[ 1 ].asJXON() ) ].join( '' ),
            osmXml     = `<osm version="0.6" upload="true" generator="hootenanny">${ jxonFeatures }</osm>`,
            mergedXml  = await Hoot.api.poiMerge( osmXml );

        let dom        = new DOMParser().parseFromString( mergedXml, 'text/xml' ),
            mapId      = this.data.currentReviewItem.mapId,

            featureOsm = await Hoot.context.connection().parse( dom, mapId );

        return featureOsm[ 0 ];
    }

    /**
     * Generate parameters for features being merged together
     *
     * @param features - list of features to merge
     * @returns {array} - data of merged items
     */
    getMergeItems( features ) {
        return _reduce( features, ( arr, feature ) => {
            let item = {
                mapId: this.data.mapId,
                id: feature.origid.substring( 1 ),
                type: feature.type
            };

            arr.push( item );

            return arr;
        }, [] );
    }

    /**
     * Remove any irrelevant reviews that don't reference either of the 2 items being merged together
     *
     * @param reviewRefs - reference of features being merged
     * @param mergeIds - ids of items being merged
     * @returns {array} - new list of relevant review items
     */
    removeNonRefs( reviewRefs, mergeIds ) {
        let reviewMergeRelationId = this.data.currentReviewItem.relationId;

        return _reduce( reviewRefs, ( arr, ref ) => {
            if ( (mergeIds.indexOf( '' + ref.id ) === -1) || ref.reviewRelationId !== reviewMergeRelationId ) {
                arr.push( ref );
            }

            return arr;
        }, [] );
    }

    /**
     * Get IDs of missing relations
     *
     * @param reviewRefs - reference of features being merged
     * @returns {array} - list of missing relation IDs
     */
    getMissingRelationIds( reviewRefs ) {
        return _reduce( reviewRefs, ( arr, ref ) => {
            let relId = `r${ ref.reviewRelationId }_${ this.data.mapId }`;

            if ( !Hoot.context.hasEntity( relId ) ) {
                arr.push( relId );
            }

            return arr;
        }, [] );
    }

    /**
     * Show/hide merge button in conflicts review container
     *
     * @param hide - true | false
     */
    toggleMergeButton( hide ) {
        d3_select( '.action-buttons .merge' ).classed( 'hidden', hide );
    }

    /**
     * Activate merge arrow layer. Arrow appears when hovering over merge button
     *
     * @param feature
     * @param againstFeature
     */
    activateMergeArrow( feature, againstFeature ) {
        let that = this;

        this.mergeArrow.from = feature;
        this.mergeArrow.to   = againstFeature;

        d3_select( '.action-buttons .merge' )
            .on( 'mouseenter', function(d3_event) {
                this.focus();

                if ( d3_event.ctrlKey || d3_event.metaKey ) {
                    that.updateMergeArrow( 'reverse' );
                } else {
                    that.updateMergeArrow();
                }

                d3_select( this )
                    .on( 'keydown', () => {
                        if ( d3_event.ctrlKey || d3_event.metaKey ) {
                            that.updateMergeArrow( 'reverse' );
                        }
                    } )
                    .on( 'keyup', () => {
                        that.updateMergeArrow();
                    } );
            } )
            .on( 'mouseleave', function() {
                this.blur();

                that.updateMergeArrow( 'delete' );
            } );
    }

    updateMergeArrow( mode ) {
        if ( !Hoot.context.graph().entities[ this.mergeArrow.from.id ] ||
            !Hoot.context.graph().entities[ this.mergeArrow.to.id ] ) {
            Hoot.context.background().updateArrowLayer( {} );

            return;
        }

        let pt1   = d3_geoCentroid( this.mergeArrow.from.asGeoJSON( Hoot.context.graph() ) ),
            pt2   = d3_geoCentroid( this.mergeArrow.to.asGeoJSON( Hoot.context.graph() ) ),
            coord = [ pt1, pt2 ];


        //Don't allow reverse for poi->poly merge
        if ( mode === 'reverse' && !this.isPoiPoly) coord = coord.reverse();

        //Warn that reverse is not allowed for poi->poly merge
        if (mode === 'reverse' && this.isPoiPoly) {
            let flash = uiFlash()
                .duration(4000)
                .iconClass('operation disabled')
                .text('Can\'t reverse POI->Poly merge');

            flash();
        }

        let gj = mode === 'delete' ? {} : {
            type: 'LineString',
            coordinates: coord
        };


        Hoot.context.background().updateArrowLayer( gj );
    }

    checkMergeButton() {
        let features = _clone( this.data.currentFeatures ),
            toFeature = features[0] ? Hoot.context.hasEntity( features[0].id ) : null,
            fromFeature = features[1] ? Hoot.context.hasEntity( features[1].id ) : null;

        if ( toFeature && fromFeature) {
            let isPoly = (f) => (f.type === 'way' && f.isClosed())
                || (f.type === 'relation' && f.isMultipolygon());
            this.isPoiPoly = (toFeature.type === 'node' && isPoly(fromFeature))
                || (isPoly(toFeature) && fromFeature.type === 'node');

            let isPoiPoi = (toFeature.type === 'node' && fromFeature.type === 'node');

            let isPolyPoly = isPoly(toFeature)
                && isPoly(fromFeature);

            let isRailWay = (toFeature.type === 'way' && !toFeature.isClosed() && toFeature.tags.railway
                && fromFeature.type === 'way' && !fromFeature.isClosed() && fromFeature.tags.railway);

            if (this.isPoiPoly || isPoiPoi || isPolyPoly || isRailWay) {
                this.toggleMergeButton( false );
                if (this.isPoiPoly) {
                    let poi = (toFeature.type === 'node') ? toFeature : fromFeature;
                    let poly = isPoly(toFeature) ? toFeature : fromFeature;
                    this.activateMergeArrow( poi, poly ); //always merge poi->poly
                } else {
                    this.activateMergeArrow( fromFeature, toFeature );
                }
            } else {
                this.toggleMergeButton( true );
            }
        } else {
            this.toggleMergeButton( true );
        }
    }

}
