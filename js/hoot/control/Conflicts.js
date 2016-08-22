/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflicts provides the user control for processing reviewable items generated during
// conflation. It does following
// 1. Traverses reviewable relations
// 2. Synchronized with iD internal entities graph on reviewable and its dependables which could be
//      a. Review tags
//      b. Entity deletion, addtion and modification during POI merge
//      c. Any other reviewable items changeset synchronization between iD entity graph with hoot OSM store
// 3. Shows reviewable item information through table and metadata text display
// 4. Shows Map visualization through review items arrow and entity highlight
// 5. POI Merge
// 6. Performs reviewable items resolution
//
// Supporting submodules are grouped into
// 1. actions: where all the actions for following are grouped
//      a. IdGraphSynch: Performs synchronization actions with iD entity graph
//      b. PoiMerge: Actions related to POI merge
//      c. ReviewResolution: Operations related to resolve and accept all
//      d. TraversReview: Operations related to traversing reviewable items.
// 2. info: Group of operations related to review information display
//      a. MetaData: Statistics display for review like total reviewable,resolved counts and 
//          Notes related to current review item.
//      b. ReviewTable: Filtered tags table for displaying differences of reviewable items
// 3. map: Group of map display controls for hightlight, arrow and pan/zoom
//      a. FeatureHighlighter: Control for highlighting the reviewable items
//      b. FeatureNavigator: Operations for pan/zoom for reviewable items.
//      c. ReviewArrowRenderer: Control for displaying arrow between reviewable items.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//      14 Apr. 2016 eslint changes -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.conflicts = function (context, sidebar) {
    var _events = d3.dispatch('exportData', 'addData');
    var _instance = {};
    var _confData;
    var _review;
    var _reviewOptions;
    var _btnEnabled = true;
    var _mapid;
    var _toolTip;
    var _timeout;


    /**
    * Instantiate sub-modules
    * @TODO: Make it lazy loading..
    **/
    _instance.actions = Hoot.control.conflicts.actions(context);
    _instance.info = Hoot.control.conflicts.info(context);
    _instance.map = Hoot.control.conflicts.map(context);


    // @TODO: track it down and make function out of it
    _instance.reviewIds = null;
    /**
     * @desc activate sidebar review related control
     * @param response - instance configuration data
     * @return sidebar review form 
     **/
    _instance.activate = function (response) {
        // clear all globals
        _resetAllVariables();
        // store intance variables
        _confData = response;
        // Sidebar control form
        _review = sidebar.append('form')
            .classed('review round space-bottom1', true);
        _review.attr('class', function () {
            return 'round space-bottom1 review';
        });
        _review.append('a')
            .classed('button dark animate strong block big pad2x pad1y js-toggle white', true)
            .style('text-align','left')
            .html('<div class="margin2 inline _loadingSmall"><span></span></div>' + 
                '<span class="strong">Checking for reviewable features...&#8230;</span>');

        context.connection().on('reviewLayerAdded', function (layerName, force) {

            var curReviewable = _instance.actions.traversereview.getCurrentReviewable();
            var mergedLayer = context.hoot().model.layers.getMergedLayer();

            if(curReviewable && mergedLayer.length>0){
                // make sure to load any missing elements
                _instance.actions.idgraphsynch.getRelationFeature(curReviewable.mapId, curReviewable.relationId, 
                function(){
 
                    _cleanupProcessing(layerName, force);         
                   
                });
                
            } else {
                _cleanupProcessing(layerName, force);
            }
  

        });


        context.map().on('drawn', function(){
            _instance.map.featurehighlighter.moveFront();
        });

        return _review;
    };

    

    /**
    * @desc This is the main call for review session where it renders all sub controls 
    * and then gets first review item.
    * @param data - object containing map id
    **/
    _instance.startReview = function (data) {
        _mapid = data.mapId;
        _confData.isDeleteEnabled = false;

        // sidebar review control toggle handler

        function toggleForm(self) {
            var cont = self.select('fieldset');
            var text = !(cont.classed('hidden'));
            cont.classed('hidden', text);
        }


        // add the meta data container at the bottom
        var reviewBody = _review.insert('fieldset', 'fieldset')
            .classed('pad1 keyline-left keyline-right keyline-bottom round-bottom fill-white hidden', true);

        _instance.info.metadata.activate(reviewBody);


        var head = _review.select('a');
            d3.selectAll(head.node()
                .childNodes)
                .remove();
        // This is the sidebar item
            head.classed('button dark animate strong block _icon big check pad2x pad1y js-toggle white', true)
                .style('text-align','center')
                .style('color','#fff')
                .text('Complete Review')
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                toggleForm(_review, this);
                });



        // create link Accept all in sidebar
        _reviewOptions = _review.selectAll('fieldset')
            .append('div')
            .classed('col12 space-bottom1', true);

        _reviewOptions.append('div')
            .classed('small keyline-all round-bottom space-bottom1', true)
            .append('label')
            .classed('pad1x pad1y', true)
            .append('a')
            .attr('href', '#')
            .text('Resolve all remaining reviews')
            .on('click', function () {

                d3.event.stopPropagation();
                d3.event.preventDefault();
                _instance.actions.reviewresolution.acceptAll(data);
            });

        // create review controls container
        var conflicts = d3.select('#content')
            .append('div')
            .attr('id', 'conflicts-container')
            .classed('pin-bottom review-block unclickable conflicts-container', true)
            .append('div')
            .attr('id', 'list-of-conflicts')
            .classed('conflicts col12 fillD pad1 space clickable', true);

        var meta = conflicts.append('span')
            .classed('_icon info dark pad0y space', true)
            .html(function () {
                return '<strong class="review-note">Initialzing...</strong>';
            });
        _instance.info.metadata.setNoteContainer(meta);
        var da = [{
            id: 'resolved',
            name: _confData.layers[1],
            text: 'Resolved',
            color: 'loud',
            icon: '_icon check',
            cmd: iD.ui.cmd('r'),
            action: _instance.actions.reviewresolution.retainFeature // resolve
        },
        {
            id: 'next',
            name: 'review_foward',
            text: 'Next',
            color: 'fill-grey button round pad0y pad1x dark small strong',
            input: 'test',
            cmd: iD.ui.cmd('n'),
            action: _instance.actions.traversereview.traverseForward // next
        },
        {
            id: 'previous',
            name: 'review_backward',
            text: 'Previous',
            color: 'fill-grey button round pad0y pad1x dark small strong',
            cmd: iD.ui.cmd('p'),
            action: _instance.actions.traversereview.traverseBackward // previous
        },
        {
            id: 'merge',
            name: 'auto_merge',
            text: 'Merge',
            color: 'loud',
            icon: '_icon plus',
            cmd: iD.ui.cmd('m'),
            action: _instance.actions.poimerge.autoMerge // Poi Merge
        },
        {
            id: 'toggletable',
            name: 'toggle_table',
            text: 'Hide Table',
            color: 'fill-grey button round pad0y pad1x dark small strong',
            //icon: '_icon plus',
            cmd: iD.ui.cmd('t'),
            action: _instance.info.reviewtable.toggleTable // Review table
        },
        {
            id: 'sharereview',
            name: 'share_review',
            text: 'Bookmark Review',
            color: 'fill-grey button round pad0y pad1x dark small strong',
            icon: '_icon plus',
            cmd: iD.ui.cmd('Ctrl+b'),
            action: _instance.actions.sharereview.publish // Review table
        }];

        var opts = conflicts.append('span')
            .attr('id', 'conflict-review-buttons')
            .classed('fr space', true);
        var optcont = opts.selectAll('a')
            .data(da)
            .enter();

        // hotkey bindings
        var keybinding = d3.keybinding('conflicts')
        .on(da[0].cmd, function() { d3.event.preventDefault(); _callHotkeyAction(da[0]); })
        .on(da[1].cmd, function() { d3.event.preventDefault(); _callHotkeyAction(da[1]); })
        .on(da[2].cmd, function() { d3.event.preventDefault(); _callHotkeyAction(da[2]); })
        .on(da[3].cmd, function() { d3.event.preventDefault(); _callHotkeyAction(da[3]); })
        .on(da[4].cmd, function() { d3.event.preventDefault(); _callHotkeyAction(da[4]); })
        .on(da[5].cmd, function() { d3.event.preventDefault(); _callHotkeyAction(da[5]); })
        ;

        d3.select(document)
            .call(keybinding);

        _toolTip = bootstrap.tooltip()
        .placement('top')
        .html(true)
        .title(function (d) {
            return iD.ui.tooltipHtml(t('review.' + d.id + '.description'), d.cmd);
        });

        optcont.append('a')
            .attr('href', '#')
            .text(function (d) {
                return d.text;
            })
            .style('background-color', function (d) {
                return d.color;
            })
            .style('color', '#fff')
            .attr('class', function (d) {
                return 'fr inline button dark ' + d.color + ' pad0y pad2x keyline-all ' + d.icon + ' ' + d.id;
            })
            .on('click', function (d) {
              // We need this delay for iD to have time to add way for adjusting
              // graph history. If you click really fast, request out paces the process
              // and end up with error where entity is not properly deleted.
              // @TODO: remove timer and replace with event if possible...
              setTimeout(function () {
                _btnEnabled = true;
                }, 500);
              if(_btnEnabled){
                _btnEnabled = false;
                d.action();
                context.background().updateReviewLayer({});
              } else {
                iD.ui.Alert('Please wait.  Processing review.','notice');
              }

            })
            .call(_toolTip);

        // set intance variable for review traverse
        _instance.actions.traversereview.initialize({'nextid': 'next'
            , 'previd':'previous', 'mapid':_mapid});

        // get the first item
        _instance.actions.traversereview.jumpTo('forward');

        //Register listener for review layer cleanup
        context.hoot().control.view.on('layerRemove.conflicts', function () {
            _instance.deactivate();

        });

        context.MapInMap.on('zoomPan.conflicts', _instance.loadReviewFeaturesMapInMap);
        context.map().on('drawn.conflicts', _.debounce(_instance.loadReviewFeaturesMapInMap, 300));
        context.ui().sidebar.adjustMargins();
    };

    _instance.loadReviewFeaturesMapInMap = function() {
            if (!context.MapInMap.hidden()) {
                //Populate the map-in-map with review items location and status
            Hoot.model.REST('ReviewGetGeoJson', _mapid, context.MapInMap.extent(), function (gj) {
                context.MapInMap.loadGeoJson(gj.features.map(function(d) {
                    var currentReviewable = _instance.actions.traversereview.getCurrentReviewable();
                    if (d.properties.relationid === currentReviewable.relationId) {
                        d.properties.class = 'locked';
                    }
                    return d;
                }) || []);
                });
            }
    };

    /**
    * @desc This function is to exit from review session and do all clean ups
    **/
    _instance.reviewNextStep = function () {

        d3.select('body').call(iD.ui.Processing(context,false));

        _confData.isDeleteEnabled = true;

        _instance.info.metadata.setInfo('All Reviews Resolved!');

        d3.selectAll(_reviewOptions.node().childNodes).remove();

        _reviewOptions.append('input')
            .attr('type', 'submit')
            .attr('value', 'Export Data')
            .classed('fill-darken0 button round pad0y pad2x small strong', true)
            .attr('border-radius','4px')
            .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    _events.exportData();
            });
        _reviewOptions.append('input')
            .attr('type', 'submit')
            .attr('value', 'Add Another Dataset')
            .classed('fill-dark button round pad0y pad2x dark small strong margin0', true)
            .attr('border-radius','4px')
            .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    _events.addData();
            });


    };

    /**
    * @desc cleans out all review related objects
    **/
    _instance.deactivate = function (doNotRemoveFromSidebar) {

        _resetStyles();
        d3.select('div.tag-table').remove();
        _instance.reviewIds = null;

        d3.select('#conflicts-container')
            .remove();

        d3.select('.hootTags').remove();
        if(!doNotRemoveFromSidebar) {
        d3.select('.review')
            .remove();
        }

        context.map().on('drawn', null);
        //Clear map-in-map
        context.MapInMap.on('zoomPan.conflicts', null);
        context.map().on('drawn.conflicts', null);
        //Have to use timeout because zoomPanHandler
        //is being debounced below
        setTimeout(function() { context.MapInMap.loadGeoJson([]); }, 700);
    };



    /**
    * @desc checks for review class existence
    **/
    _instance.isConflictReviewExist = function() {
        return context.hoot().checkReviewMode();
    };

    /**
    * @desc current map id
    * @return current map id
    **/
    _instance.getMapId = function() {
        return _mapid;
    };

    /**
    * @desc
    **/
    _instance.vischeck = function(){
        var layers=context.hoot().model.layers.getLayers();
        var vis = _.filter(layers, function(d){return d.vis;});
        if(vis.length>1){
            iD.ui.Alert('Swap to Conflated Layer before accepting!','warning',new Error().stack);
            return false;
            }
        return true;
    };

    /**
    * @desc  gets active review item
    * @param coldIdx - table column index
    **/
    _instance.activeConflict = function(colIdx){
        var cols = _instance.info.reviewtable.poiTableCols();
        var activeFeatureId = null;
        if(cols[colIdx]) {
            activeFeatureId = cols[colIdx].id;
            }
        return activeFeatureId;
    };

    /**
    * @desc Locks up the screen while processing
    * @param lock - lock switch
    * @param message - message to show during lock 
    **/
    _instance.setProcessing = function(lock, message) {
        if(lock) {
            if(d3.selectAll('#processingDiv').empty() === true) {
            d3.select('body').call(iD.ui.Processing(context,true,message));
        } else {
                d3.select('#processingDivLabel').text(message);
            }

            _screenLockFree(10000);
        } else {
            _screenLockFree(700);
        }
    };

    /**
    * @desc make sure that screen does not get locked up forever
    **/
    var _screenLockFree = function(delay){
        if(_timeout){
            clearTimeout(_timeout);
        }
        _timeout = setTimeout(function(){
            _timeout = null;
        d3.select('body').call(iD.ui.Processing(context,false));
        },delay);
    };

    _instance.getToolTip = function() {
        return _toolTip;
    };
    /**
    * @desc This cleans up all class variable. If not clean then it will get resued
    * when we load conflict UI..
    **/
    var _resetAllVariables = function(){
        _confData = undefined;
		_review = undefined;
		_reviewOptions = undefined;
		_btnEnabled = true;
		_mapid = undefined;
		_toolTip = undefined;
        _timeout = undefined;

        _instance.actions.reset();
        _instance.info.reset();
        _instance.map.reset();
        _instance.reviewIds = null;
    };

    /**
    * @desc Hotkey callback wrapper function with lock validation
    * @param da - action data object
    **/
    var _callHotkeyAction = function(da) {
        if(d3.selectAll('#processingDiv').empty() === false) {
            return;
        }
        da.action();
    };

    /**
    * @desc This clears all icon high lights
    **/
    var _resetStyles = function () {
        _instance.map.featurehighlighter.resetHighlight();
    };

    /**
    * @desc Clears processing and do post layer loading
    * @param layerName
    * @param force
    **/
    var _cleanupProcessing = function(layerName, force) {
        if(force === true) {
            _instance.setProcessing(false);
            
            _instance.map.featurehighlighter.hightligtDependents();

        } else {
            var confLayerName = context.hoot().model.layers.getNameBymapId(_mapid);
            if(layerName === confLayerName) {
                _instance.setProcessing(false);
            }
        }        
    };

    return d3.rebind(_instance, _events, 'on');
};
