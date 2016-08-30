/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.info.metadata displays review items statistics and current review item note
// where
// 1. Total: total reviewable items count for a conflation result
// 2. Resolved: Numbers of resolved items (total - remaining)
// 3. Remaining: Numbers of unresolved items.
// 4. Note: Any note (The reason for marking it as reviewable) for current reviewable item
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.info.metadata = function (context)
{
    var _events = d3.dispatch();
    var _instance = {};
    var _currentReviewableMeta = null;
    var _metaHead;
    var _noteContainer;

    /**
    * @desc activate control by adding the div to the conflicts body
    * @param reviewBody - container
    **/
    _instance.activate = function(reviewBody) {
        _metaHead = reviewBody.append('div')
            .classed('form-field pad0', true)
            .append('span')
            .classed('_icon info reviewCount', true);
        // Initial text change this if needed
        _metaHead.text('There are 0 reviews:');
    };

    /**
    * @desc sets the meta data header text
    * @param text - the input text
    **/
    _instance.setInfo = function(text){
        _metaHead.text(text);
    };

    /**
    * @desc gets the statics information for the meta data
    * @return object containing statics information for the meta data
    **/
    _instance.getCurrentReviewMeta = function() {
        return _currentReviewableMeta;
    };

    /**
    * @desc sets the statics information for the meta data
    * @param itm - object containing statics information for the meta data
    **/
    _instance.setCurrentReviewMeta = function(itm) {
        _currentReviewableMeta = itm;
    };


    /**
    * @desc Setter for note container
    * @param cont - container object
    **/
    _instance.setNoteContainer = function(cont) {
        _noteContainer = cont;
    };
    /**
    * @desc This is where the note and othere reviewable statistics are set for user
    * @param note - note text that overrides what is in  hoot:review:note tag
    **/
    _instance.updateMeta = function(note) {
        var multiFeatureMsg = '';

        var curMeta = _instance.getCurrentReviewMeta();
        var currentReviewable = context.hoot().control.conflicts.actions.traversereview.getCurrentReviewable();

        var nTotal = 0;
        var nReviewed = 0;
        var nUnreviewed = 0;
        if(curMeta){
            nTotal = 1*curMeta.totalCount;
            nUnreviewed = 1*curMeta.unreviewedCount;
            nReviewed = nTotal - nUnreviewed;
        }
        var rId = 'r' + currentReviewable.relationId + '_' + currentReviewable.mapId;
        var rf = context.hasEntity(rId);

        var noteText = '';
        if(rf){
            var rfNote = rf.tags['hoot:review:note'];
            if(rfNote){
                noteText = rfNote;
            }
        }
        if(note){
            noteText = note;
        }
        _noteContainer.html('<strong class="review-note">' + 'Review note: ' + noteText + '</strong><br><strong class="reviews-remaining">' + 'Reviews remaining: ' +
            nUnreviewed +
            '  (Resolved: ' + nReviewed +
                multiFeatureMsg + ')</strong>');
        context.hoot().control.conflicts.info.metadata.setInfo('There are ' + nUnreviewed + ' reviews');
    };

    return d3.rebind(_instance, _events, 'on');
};