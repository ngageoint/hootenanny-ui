/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts.info.reviewtable is for displaying review items table
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflicts.info.reviewtable = function (context)
{
    var _events = d3.dispatch();
    var _instance = {};
    var _poiTableCols= [];



    /**
    * @desc creates tag table for reviewable items
    * @param poiTableCols - table columns
    **/
    _instance.buildPoiTable = function (poiTableCols) {
        var elem = d3.select('#conflicts-container');
        _poiTableCols = poiTableCols;
        var feats = poiTableCols;
        function addEllipsis(val) {
            var max = 32;
            if (val && val.length > max) {
                return val.substring(0, max) + '...';
            }
            return val;
        }
        //console.log(feats);
        d3.select('div.tag-table').remove();
        var ftable = elem.insert('div','div.conflicts')
            .classed('tag-table block fr clickable', true)
            .append('table')
            .classed('round keyline-all', true);
        var f1 = _filterTags(feats[0] ? feats[0].tags : {});
        var f2 = _filterTags(feats[1] ? feats[1].tags : {});
        var fmerged = _mergeTags([f1, f2]);
        fmerged.forEach(function (d) {
            var r = ftable.append('tr').classed('', true);
            r.append('td').classed('fillD', true).text(d.key);
            r.append('td').classed('f1', true).text(addEllipsis(d.value[0]))
            .on('click', function(){
                if(context.hasEntity(feats[0].id)){
                    var sel = iD.modes.Select(context, [feats[0].id]);
                    _panToEntity(context.entity(feats[0].id));
                    sel.suppressMenu(true);
                    context.enter(sel);
                }
            })
            .on('mouseenter',function(){d3.selectAll('.activeReviewFeature').classed('extra-highlight',true);})
            .on('mouseleave',function(){d3.selectAll('.activeReviewFeature').classed('extra-highlight',false);});
            r.append('td').classed('f2', true).text(addEllipsis(d.value[1]))
            .on('click', function(){
                if(context.hasEntity(feats[1].id)){
                    var sel = iD.modes.Select(context, [feats[1].id]);
                    _panToEntity(context.entity(feats[1].id));
                    sel.suppressMenu(true);
                    context.enter(sel);
                }
            })
            .on('mouseenter',function(){d3.selectAll('.activeReviewFeature2').classed('extra-highlight',true);})
            .on('mouseleave',function(){d3.selectAll('.activeReviewFeature2').classed('extra-highlight',false);});

        });
        _checkToggleText();
    };




    /**
    * @desc show/hide toggler
    **/
    _instance.toggleTable = function() {
        var t = d3.select('div.tag-table');
        t.classed('block fr', t.classed('hide'));
        t.classed('hide', !t.classed('hide'));
        _checkToggleText();
    };


    /**
    * @desc Tags merge
    * @param tags - target tags
    **/
    var _mergeTags = function (tags) {
        var mergedKeys = d3.set();
        var merged = d3.map();
        tags.forEach(function(t) {
            t.forEach(function(d) {
                mergedKeys.add(d.key);
            });
        });
        mergedKeys.values().sort().forEach(function(d) {
            merged.set(d, []);
            tags.forEach(function(t) {
                var m = d3.map();
                t.forEach(function(p) {
                    m.set(p.key, p.value);
                });
                merged.get(d).push(m.has(d) ? m.get(d) : null);
            });
        });

        return merged.entries();
    };

    /**
    * @desc Tags filter
    * @param tags - target tags
    **/
    var _filterTags = function (tags) {
        var tagBlacklist = [/hoot*/,
            /REF1/,
            /REF2/,
            /error:circular/,
            /source:datetime/,
            /source:ingest:datetime/,
            /uuid/];
        return d3.entries(tags).filter(function (d) { //remove blacklist tags
            return tagBlacklist.every(function (r) {
                return !d.key.match(r);
            });
        });
    };

    /**
    * @desc  Pan to entity
    * @param id  - target id
    **/
    var _panToEntity = function (id) {
        context.hoot().control.conflicts.map.featureNavigator.panToEntity(id);
    };

    /**
    * @desc Toggler text
    **/
    var _checkToggleText = function() {
        var tooltip = context.hoot().control.conflicts.getToolTip();
        d3.select('a.toggletable')
            .text(d3.select('div.tag-table').classed('hide') ? 'Show Table' : 'Hide Table')
            .call(tooltip);
    };

    /**
    * @desc tables column getter
    **/
    _instance.poiTableCols = function() {
        return _poiTableCols;
    };

    return d3.rebind(_instance, _events, 'on');
};