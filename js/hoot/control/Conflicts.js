// This class represents the review traversing and manimuplation control that seats at
// the bottom of map during Hootennay review session.
Hoot.control.conflicts = function (context, sidebar) {
    var event = d3.dispatch('acceptAll', 'exportData', 'addData', 'reviewDone','zoomToConflict', 'jumpToNext');
    var Conflict = {};
    var confData;
    var Review;
    var reviewOptions;
    var metaHead;
    var metaHeadAccept;
    var activeConflict, activeConflictReviewItem;
    var btnEnabled = true;
    var mergeFeatures;
    var activeEntity;
    var getFeatureTimer;

    var currentReviewableMeta = null;
    var processingTimer;

    var currentReviewable = null;

    Conflict.isProcessingReview = false;
    Conflict.activeEntity = function(){return activeEntity;};
    Conflict.activeConflict = function(){return activeConflict;};
    Conflict.activeConflictReviewItem = function(){return activeConflictReviewItem;};
    Conflict.activate = function (response) {
        confData = response;
        Review = sidebar.append('form')
            .classed('review round space-bottom1', true);
        Review.attr('class', function () {
            return 'round space-bottom1 review';
        });
        Review.append('a')
            .classed('button dark animate strong block big pad2x pad1y js-toggle white', true)
            .style('text-align','left')
            .html('<div class="margin2 inline _loadingSmall"><span></span></div>' + '<span class="strong">Checking for review items&#8230;</span>');
        return Review;
    };
    Conflict.nextFunction;
    Conflict.highlightLayerTable = null;

    // This is the main call for review session
    Conflict.startReview = function (data) {
    	var entity;
        var mapid = data.mapId;
        var reviewCount = 0;
        var index = 0;
        Conflict.reviews;

        function getCurrentReviewMeta() {
            return currentReviewableMeta;
        }

        function setCurrentReviewMeta(itm) {
            currentReviewableMeta = itm;
        }


        // Helper function to zoom to specified bound
        function panToBounds(bounds) {
            function boundsToExtent() {
                var boundsParts = bounds.split(',');
                var lowerLeftExtent = iD.geo.Extent([boundsParts[0], boundsParts[1]]);
                var upperRightExtent = iD.geo.Extent([boundsParts[2], boundsParts[3]]);
                var extent = lowerLeftExtent.extend(upperRightExtent);
                return extent;
            }
            var extent = boundsToExtent();
            var map = context.map();
            var zoom = Math.min(20, (map.extentZoom(extent)));
            map.centerZoom(extent.center(), (zoom));
        }

        // Helper function to zoom to the bounding box of a entity
        function panToEntity(entity, force) {
        	//only pan if feature is not on screen
        	var map = context.map();
        	var entityExtent = entity.extent(context.graph())? entity.extent(context.graph()) : undefined;
        	var mapExtent = map.extent();
        	var entityCenter = entityExtent.center();

        	if(entityExtent == undefined){
        		iD.ui.Alert("Could not locate selected feature with id: " + entity.id + ".",'warning')
        		return;
        	}

            if(force && force === true){
                var zoom = Math.min(20, map.zoom());
                if (zoom < 16) {
                    zoom = 16.01;
                }
                map.centerZoom(entityCenter,(zoom));
            } else {
                if(_.isEmpty(_.filter(context.intersects(mapExtent),function(n){return n.id==entity.id;}))){
                    var zoom = Math.min(20, map.zoom());
                    if (zoom < 16) {
                        zoom = 16.01;
                    }
                    map.centerZoom(entityCenter,(zoom));
                }
            }
            	
        }

        // Helper function for jumping to next reviewable
        // Current sequence offset determines where to jump
        // If next reviewable is already reviewed then we do random jump
        var jumpFor = function () {
            jumpTo('forward');
        };

        // Helper function for jumping to previoius reviewable
        var jumpBack = function () {
            jumpTo('backward');
        };

        var getLoadedRelationMembersCount = function(fid){
            var nCnt = 0
            try
            {
                var f = context.hasEntity(fid);
                if(f){
                    for(var i=0; i<f.members.length; i++){
                        if(context.hasEntity(f.members[i].id)){
                            nCnt++;
                        }
                    }
                }
            }
            catch(error)
            {

            }
            finally
            {

            }
                
                
            return nCnt;
        }

        // Returns the entity for the specified relation
        // If it is not loaded in iD then we use loadMissing to load
        // Relation and the members.
        var getRelationFeature = function(mapid, relationid, callback){
            var fid = 'r' + relationid + '_' + mapid;
            var f = context.hasEntity(fid);
           

            if(f) {
                // for merged automerge should have loaded relation and members to ui
                // at this point so it will not try to reload..

                var nMemCnt = getLoadedRelationMembersCount(fid) ;
                                    
                if(nMemCnt > 0){
                    if(nMemCnt === 1){
                        disableMergeButton(true);
                    }
                    callback(f);
                } else {
                    iD.ui.Alert('There are not members in review relation.','warning');
                }
            } else {
                var layerNames = d3.entries(hoot.loadedLayers()).filter(function(d) {
                    return 1*d.value.mapId === 1*mapid;

                });

                var validateMemberCnt = function(fid, fnc) {
                    var nMemCnt = getLoadedRelationMembersCount(fid) ;
                    var f = context.hasEntity(fid);          
                    if(nMemCnt > 0){
                        if(nMemCnt === 1){
                            disableMergeButton(true);
                        }
                        panToEntity(f, true);
                        fnc(f);
                    } else {
                        iD.ui.Alert('There are not members in review relation.','warning');
                    }
                }
                var layerName = layerNames[0].key;

                context.loadMissing([fid], function(err, entities) {
                    try
                    {
                        if(err){
                            throw 'Failed to load Missing Entities.';
                        }
                        if (entities.data.length) {
                            // Gets the relation from UI not back end
                            f = context.hasEntity(fid);


                            var members = [];
                            for(var i=0; i<f.members.length; i++){
                                // Load entities only when they are missing
                                if(!context.hasEntity(f.members[i].id)){
                                    members.push(f.members[i].id);
                                }
                            }

                            if(members.length > 0){
                                context.loadMissing(members, function(err2, entities2) {
                                    validateMemberCnt(fid, callback);
                                });
                            } else {
                                validateMemberCnt(fid, callback);
                            }
                            
                            
                        } else {
                            throw 'Failed to load Missing Entities.';
                        }
                    }
                    catch (err)
                    {
                        iD.ui.Alert(err,'error');
                    }
                    finally
                    {
                        
                    }
                    }, layerName);
            }
        }


        // Main reviewable traversing mechanism
        // It first gets the available reviewable infor using ReviewGetStatistics
        // If there are reviewables then calls get next
        // If checks to see if currentReviewable is populated and if not then
        // it thinks it is first time in review session. It calls random reviewable by
        // using sequnce offset of -999 where anything less then -1 will get you the random
        // reviewable.
        var jumpTo = function(direction) {

            Hoot.model.REST('ReviewGetStatistics', mapid, function (error, response) {
                if(error){
                    iD.ui.Alert('Failed to get statistics.','warning');
                    // there was error so throw error and exit review since this was major melt down?
                    return;
                }

                setCurrentReviewMeta(response);

                // this handles only for first time
                // Modify to able to handle when pressed next 
                var reviewData = {};
                if(currentReviewable){
                    reviewData.mapId = currentReviewable.mapId;
                    reviewData.sequence = currentReviewable.sortOrder;
                    reviewData.direction = direction;
                } else {
                    reviewData.mapId = data.mapId;
                    // something less then -1 will get random reviewable
                    reviewData.sequence = -999;
                    reviewData.direction = direction;
                }
            

                Hoot.model.REST('reviewGetNext', reviewData, function (error, response) {
                    try {
                        if(error){
                            throw 'Failed to retrieve next reviewable from service!';
                        }


                        if((1*response.resultCount) > 0){
                            currentReviewable = response;
                            getRelationFeature(reviewData.mapId, response.relationId, function(newReviewItem){
                                highlightLayer(newReviewItem.members[0], newReviewItem.members[1]);

                                // Move this to proper location since highlightLayer is timer asynch
                                panToEntity(newReviewItem, true);
                            });
                                
                        } else {
                            iD.ui.Alert('There are no more available review item. Exiting review session.',
                                'info');
                            exitReviewSession('Exiting review session...');
                        }
                    }
                    catch (ex) {
                        var r = confirm('Failed to retrieve next reviewable! Do you want to continue?');
                        if(r === false){
                            exitReviewSession('Exiting review session...');
                        }
                    } finally {
                        Conflict.setProcessing(false);
                    }
                });                
            });
            

        }

        var disableMergeButton = function (doDisable){
            var btn = d3.select('.merge');
            if(btn){
                if(doDisable === true){
                    btn.classed('hide', true);
                } else {
                    btn.classed('hide', false);
                }
            }
        }
        // This clears all icon high lights
        var resetStyles = function () {
            d3.selectAll('path').classed('activeReviewFeature', false);
            d3.selectAll('path').classed('activeReviewFeature2', false);
        };
        var highlightLayer = function (ritem, raitem) {
            var revieweeList = [];
            //console.log(item);
            var idid = null;
            if(ritem){
                idid = ritem.id;
                revieweeList.push(idid);
            }
            var idid2 = null;
            if(raitem) {
                idid2 = raitem.id;
                revieweeList.push(idid2);
            }
            var feature, againstFeature;
            var max = 4;
            var calls = 0;
            var loadedMissing = false;
            clearInterval(getFeatureTimer);
            //HACK alert:
            //TODO: come up with a better way to manage the active layer name
            var layerNames = d3.entries(hoot.loadedLayers()).filter(function(d) {
                return 1*d.value.mapId === 1*mapid;

            });
            var layerName = layerNames[0].key;

            getFeatureTimer = setInterval(function () {
                if (calls < max) {
                    getFeature();
                    calls++;
                } else {
                    //Make a call to grab the individual feature
                    context.loadMissing(revieweeList, function(err, entities) {
                     
                        if (entities.data.length) {
                            feature = entities.data.filter(function(d) {
                                return d.id === idid;
                            }).pop();
                            againstFeature = entities.data.filter(function(d) {
                                return d.id === idid2;
                            }).pop();
                            getFeatureStopTimer();
                        } else {
                            window.console.error(entities);
                        }

                    }, layerName);
                }
            }, 500);
            var getFeatureStopTimer = function (skip) {
                clearInterval(getFeatureTimer);
                if (!skip) {
                    //Merge currently only works on nodes
                    if ((feature && againstFeature) && (feature.id.charAt(0) === 'n' && againstFeature.id.charAt(0) === 'n')) {
                        //Show merge button
                        d3.select('a.merge').classed('hide', false);
                        //Override with current pair of review features
                        mergeFeatures = function() {
                        	if(context.graph().entities[feature.id] && context.graph().entities[againstFeature.id]){
                        		disableMergeButton(true);
                                context.hoot().model.conflicts.autoMergeFeature(
                                  feature, againstFeature, mapid, currentReviewable.relationId
                                );
                        	} else {
                        		iD.ui.Alert("Nothing to merge.",'notice');
                            	return;
                        	}
                        };
                        function loadArrow(d) {
                            if (d3.event) d3.event.preventDefault();
                            if(!context.graph()){
                                return;
                            }
                            if(!context.graph().entities[feature.id] ||
                             !context.graph().entities[againstFeature.id]){
                        		context.background().updateArrowLayer({});
                        		return;
                        	}
                            if (d3.event.type === 'mouseover' || d3.event.type === 'mouseenter') {
                                context.background().updateArrowLayer(d);
                            } else {
                                context.background().updateArrowLayer({});
                            }
                        }
                        var arw = { "type": "LineString",
                                    "coordinates": [ againstFeature.loc, feature.loc]
                        };
                        //Add hover handler to show arrow
                        d3.select('a.merge').on('mouseenter', function() {
                            loadArrow(arw);
                        }).on('mouseleave', function() {
                            loadArrow(arw);
                        });
                    } else {
                        //Hide merge button
                        d3.select('a.merge').classed('hide', true);
                        //Override with no-op
                        mergeFeatures = function() {};
                        d3.select('a.merge').on('mouseenter', function() {}).on('mouseleave', function() {});
                    }

                    resetStyles();
                    Conflict.reviewIds = [];
                    var panToId = null;
                    if (feature) {
                        Conflict.reviewIds.push(feature);
                        panToId = feature.id;
                        d3.selectAll('.activeReviewFeature')
                            .classed('activeReviewFeature', false);
                        d3.selectAll('.' + feature.id)
                            .classed('tag-hoot activeReviewFeature', true);
                        
                    }
                    if (againstFeature) {
                        Conflict.reviewIds.push(againstFeature);
                        if(!panToId){
                            panToId = againstFeature.id;
                        }
                        d3.selectAll('.activeReviewFeature2')
                            .classed('activeReviewFeature2', false);
                        d3.selectAll('.' + againstFeature.id)
                            .classed('tag-hoot activeReviewFeature2', true);
                    }

                    buildPoiTable(d3.select('#conflicts-container'), Conflict.reviewIds);
                    updateMeta(null);
                    if(panToId) {
                        panToEntity(context.entity(panToId));
                    }

                    
                }
            };
            var getFeature = function () {
                feature = null;
                if(idid){
                    feature = context.hasEntity(idid);
                }
                againstFeature = null;
                if(idid2){
                    againstFeature = context.hasEntity(idid2);
                }
               

                if (feature && againstFeature) {
                    if (feature.id === againstFeature.id) {
                        //window.console.log('review against self, resolving');
                        getFeatureStopTimer(true);
                        retainFeature();
                    } else {
                        getFeatureStopTimer();
                    }
                } else {
                    if (context.changes().deleted.some(
                        function(d) {
                            return d.id === idid || d.id === idid2;
                        })
                    ) {
                        getFeatureStopTimer(true);
                        iD.ui.Alert('One feature involved in this review has already been deleted','warning');
                    } else {
                        //window.console.log('wait for another interval to fire');
                    }
                }
            };
            var filterTags = function (tags) {
                var tagBlacklist = [/hoot*/,
                    /REF1/,
                    /REF2/,
                    /error:circular/,
                    /source:datetime/,
                    /source:ingest:datetime/,
                    /uuid/];
                return d3.entries(tags).filter(function (d) { //remove blacklist tags
                    return tagBlacklist.every(function (r) {
                        return d.key.match(r) === null;
                    });
                });
            };

            var mergeTags = function (tags) {
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

            var buildPoiTable = function (elem, feats) {
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
                var f1 = filterTags(feats[0] ? feats[0].tags : {});
                var f2 = filterTags(feats[1] ? feats[1].tags : {});
                var fmerged = mergeTags([f1, f2]);
                fmerged.forEach(function (d) {
                    var r = ftable.append('tr').classed('', true);
                    r.append('td').classed('fillD', true).text(d.key);
                    r.append('td').classed('f1', true).text(addEllipsis(d.value[0]))
                    .on('click', function(d){
                        var sel = iD.modes.Select(context, [feats[0].id]);
                        panToEntity(context.entity(feats[0].id));
                        sel.suppressMenu(true);
                        context.enter(sel);
                    });
                    r.append('td').classed('f2', true).text(addEllipsis(d.value[1]))
                    .on('click', function(d){
                        var sel = iD.modes.Select(context, [feats[1].id]);
                        panToEntity(context.entity(feats[1].id));
                        sel.suppressMenu(true);
                        context.enter(sel);
                    });

                });
                checkToggleText();
            };
        };
        var reviewItemID = function (item) {
            var a = {
                way: 'w',
                node: 'n',
                relation: 'r'
            };
            return a[item.type] + item.id + '_' + mapid;
        };
        var reviewAgainstID = function (item) {
            var a = {
                way: 'w',
                node: 'n',
                relation: 'r'
            };
            return a[item.itemToReviewAgainst.type] + item.itemToReviewAgainst.id + '_' + mapid;
        };

        var done = false;
        // Resolves all reviewables
        function acceptAll() {
            var doProceed = true;

            Hoot.model.REST('resolveAllReviews', data.mapId, function (error, response)
            {
              finalizeReviewSession('Saving All Review Features.....');
              d3.select('body').call(iD.ui.Processing(context,true,"Saving All Review Features..."));
              event.acceptAll(data);
            });
        }

        // This is where the note and othere reviewable statistics are set for user
        function updateMeta(note) {
            var multiFeatureMsg = '';

            var curMeta = getCurrentReviewMeta();

            var nTotal = 0;
            var nReviewed = 0;
            var nUnreviewed = 0;
            if(curMeta){
                nTotal = 1*curMeta.totalCount;
                nUnreviewed = 1*curMeta.unreviewedCount;
                nReviewed = nTotal - nUnreviewed;
            }
            var rId = 'r' + currentReviewable.relationId + '_' + mapid;
            var rf = context.hasEntity(rId);

            var noteText = "";
            if(rf){
                var rfNote = rf.tags['hoot:review:note'];
                if(rfNote){
                    noteText = rfNote;
                }
            }
            if(note){
                noteText = note;
            }
            meta.html('<strong class="review-note">' + 'Review note: ' + noteText + '<br>' + 'Review items remaining: ' +
                nUnreviewed +
                '  (Resolved: ' + nReviewed +
                    multiFeatureMsg + ')</strong>');
        }

        var vischeck = function(){
            var layers=context.hoot().model.layers.getLayers();
            var vis = _.filter(layers, function(d){return d.vis;});
            if(vis.length>1){iD.ui.Alert('Swap to Conflated Layer before accepting!','warning');return false;}
            return true;
        };

        var traverseForward = function () {
            var vicheck = vischeck();
            if(!vicheck){return;}
            jumpFor();
        };

        Conflict.nextFunction = traverseForward;

        var traverseBackward = function () {
            var vicheck = vischeck();
            if(!vicheck){return;}
            jumpBack();
        };

        var autoMerge = function() {
            //Overridden in highlightLayer
            mergeFeatures();
        };

        function checkToggleText() {
            d3.select('a.toggletable')
                .text(d3.select('div.tag-table').classed('hide') ? 'Show Table' : 'Hide Table')
                .call(tooltip);
        }

        var toggleTable = function() {
            var t = d3.select('div.tag-table');
            t.classed('block fr', t.classed('hide'));
            t.classed('hide', !t.classed('hide'));
            checkToggleText();
        };

        var updateReviewTagsForResolve = function(reviewRelationEntity)
        {
                var tags = reviewRelationEntity.tags;
                //console.log(tags);
                var newTags = _.clone(tags);
                newTags['hoot:review:needs'] = 'no';
                context.perform(
                  iD.actions.ChangeTags(reviewRelationEntity.id, newTags), t('operations.change_tags.annotation'));
        }

        // This function resolves a reviewable item
        var retainFeature = function () {
            try {
                Conflict.setProcessing(true);
                var vicheck = vischeck();
                if(!vicheck){                
                    return;
                }

                if(currentReviewable) {
                  
                    var fid = 'r' + currentReviewable.relationId + '_' + currentReviewable.mapId;
                    var reviewableRelEntity = context.hasEntity(fid);
                    
                    for(var i=0; i<reviewableRelEntity.members.length; i++) {
                        var itemKlass = reviewableRelEntity.members[i].id;
                        var classid = 'activeReviewFeature';
                        if(i > 0) {
                            classid += '' + (i + 1);
                        }
                        d3.selectAll('.' + itemKlass)
                            .classed(classid, false);
                    }
                    d3.select('div.tag-table').remove();


                    updateReviewTagsForResolve(reviewableRelEntity);

                    var hasChanges = context.history().hasChanges();
                    if (hasChanges) {
                    	
                    	iD.modes.Save(context).save(context, function () {

                        jumpFor();

                        });
                    } else {
                        	jumpFor();
                    }
                } else {
                	iD.ui.Alert("Nothing to review.",'notice');
                }
            } catch (err) {
            	iD.ui.Alert(err,'error');
            } finally {
                Conflict.setProcessing(false);
            }
        };

        function toggleForm(self) {
            var cont = self.select('fieldset');
            var text = (cont.classed('hidden')) ? false : true;
            cont.classed('hidden', text);
        }

        var finalizeReviewSession = function(userMsg) {
            done=true;
            resetStyles();
            d3.select('div.tag-table').remove();
            Conflict.reviewIds = null;
            metaHead.text(userMsg);
            Conflict.reviewComplete();
            d3.select('.hootTags').remove();
        }

        var exitReviewSession = function(msg) {
            finalizeReviewSession(msg);
            Conflict.reviewNextStep();
        }

        var reviewBody = Review.insert('fieldset', 'fieldset')
            .classed('pad1 keyline-left keyline-right keyline-bottom round-bottom fill-white hidden', true);
        metaHead = reviewBody.append('div')
            .classed('form-field pad0', true)
            .append('span')
            .classed('_icon info reviewCount', true);

        var head = Review.select('a');
            d3.selectAll(head.node()
                .childNodes)
                .remove();
            head.classed('button dark animate strong block _icon big check pad2x pad1y js-toggle white', true)
                .style('text-align','center')
                .style('color','#fff')
                .text('Complete Review')
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    toggleForm(Review, this);
                });

        confData.isDeleteEnabled = true;

        confData.isDeleteEnabled = false;

        metaHead.text('There are ' + data.numItemsReturned + ' review items:');
        reviewOptions = Review.selectAll('fieldset')
            .append('div')
            .classed('col12 space-bottom1', true);

        metaHeadAccept = reviewOptions.append('div')
            .classed('small keyline-all round-bottom space-bottom1', true)
            .append('label')
            .classed('pad1x pad1y', true)
            .append('a')
            .attr('href', '#')
            .text('Resolve all remaining reviews')
            .on('click', function () {

                d3.event.stopPropagation();
                d3.event.preventDefault();
                acceptAll();
            });

        var conflicts = d3.select('#content')
            .append('div')
            .attr('id', 'conflicts-container')
            .classed('pin-bottom review-block unclickable', true)
            .append('div')
            .classed('conflicts col12 fillD pad1 space clickable', true);

        var meta = conflicts.append('span')
            .classed('_icon info dark pad0y space', true)
            .html(function () {
                return '<strong class="review-note">1 of ' + reviewCount + '</strong>';
            });
        var da = [{
            id: 'resolved',
            name: confData.layers[1],
            text: 'Resolved',
            color: 'loud',
            icon: '_icon check',
            cmd: iD.ui.cmd('r'),
            action: retainFeature
        },
        {
            id: 'next',
            name: 'review_foward',
            text: 'Next',
            color: 'fill-grey button round pad0y pad1x dark small strong',
            input: 'test',
            cmd: iD.ui.cmd('n'),
            action: traverseForward
        },
        {
            id: 'previous',
            name: 'review_backward',
            text: 'Previous',
            color: 'fill-grey button round pad0y pad1x dark small strong',
            cmd: iD.ui.cmd('p'),
            action: traverseBackward
        },
        {
            id: 'merge',
            name: 'auto_merge',
            text: 'Merge',
            color: 'loud',
            icon: '_icon plus',
            cmd: iD.ui.cmd('m'),
            action: autoMerge
        },
        {
            id: 'toggletable',
            name: 'toggle_table',
            text: 'Hide Table',
            color: 'fill-grey button round pad0y pad1x dark small strong',
            //icon: '_icon plus',
            cmd: iD.ui.cmd('t'),
            action: toggleTable
        }];

        var opts = conflicts.append('span')
            .classed('fr space', true);
        var optcont = opts.selectAll('a')
            .data(da)
            .enter();

        var keybinding = d3.keybinding('conflicts')
        .on(da[0].cmd, function() { d3.event.preventDefault(); da[0].action(); })
        .on(da[1].cmd, function() { d3.event.preventDefault(); da[1].action(); })
        .on(da[2].cmd, function() { d3.event.preventDefault(); da[2].action(); })
        .on(da[3].cmd, function() { d3.event.preventDefault(); da[3].action(); })
        .on(da[4].cmd, function() { d3.event.preventDefault(); da[4].action(); })
        ;

        d3.select(document)
            .call(keybinding);

        var tooltip = bootstrap.tooltip()
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
              setTimeout(function () {
                btnEnabled = true;
                }, 500);
              if(btnEnabled){
                btnEnabled = false;
                d.action();
              } else {
            	  iD.ui.Alert('Please wait. Processing review.','notice');
              }

            })
            .call(tooltip);

        Conflict.highlightLayerTable = highlightLayer;
        jumpFor();
    };
    // This function is to exit from review session and do all clean ups
    Conflict.reviewNextStep = function () {

    	d3.select('body').call(iD.ui.Processing(context,false));

      confData.isDeleteEnabled = true;
        metaHead.text('All Review Items Resolved!');

        d3.selectAll(reviewOptions.node().childNodes).remove();

        reviewOptions.append('input')
            .attr('type', 'submit')
            .attr('value', 'Export Data')
            .classed('fill-darken0 button round pad0y pad2x small strong', true)
            .attr('border-radius','4px')
            .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    event.exportData();
            });
        reviewOptions.append('input')
            .attr('type', 'submit')
            .attr('value', 'Add Another Dataset')
            .classed('fill-dark button round pad0y pad2x dark small strong margin0', true)
            .attr('border-radius','4px')
            .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    event.addData();
            });


    };


    Conflict.deactivate = function () {
        d3.select('.review')
            .remove();
        d3.select('.conflicts')
            .remove();
    };
    Conflict.reviewComplete = function () {
        d3.select('.conflicts')
            .remove();
    };


    Conflict.isConflictReviewExist = function() {
        var exist = false;
        if(d3.select('.conflicts')){
            exist = true;
        }
        return exist;
    };

    Conflict.gotoNext = function() {
        context.flush(true);
        Conflict.nextFunction();
    }

    // It sets processing marker to prevent user from click resolve before
    // previous resolve is not done
    Conflict.setProcessing = function(isProc){
        if(isProc === true){
            if(Conflict.isProcessingReview === true){
                iD.ui.Alert("Processing review. Please wait.",'notice');
                return;
            }
            Conflict.isProcessingReview = true;
            if(processingTimer){
                clearTimeout(processingTimer);
            }

            processingTimer = setTimeout(function () {
                Conflict.isProcessingReview = false;
            }, 2000);
        } else {
            if(processingTimer){
                clearTimeout(processingTimer);
            }

            Conflict.isProcessingReview = false;
        }
    }

    //Register listener for review layer cleanup
    context.hoot().control.view.on('layerRemove.validation', function (layerName, isPrimary) {
        // we need tagTable removed when UI is review mode and was displaying tag table
        d3.select('#conflicts-container').remove();
        Conflict.reviewIds = null;
    });

    return d3.rebind(Conflict, event, 'on');
};
