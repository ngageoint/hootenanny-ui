Hoot.control.conflicts = function (context, sidebar) {
    var event = d3.dispatch('acceptAll', 'discardAll', 'removeFeature', 'exportData', 'addData', 'reviewDone','zoomToConflict');
    var Conflict = {};
    var confData;
    var Review;
    var reviewOptions;
    var metaHead;
    var metaHeadDiscard;
    var metaHeadAccept;
    var activeConflict, activeConflictReviewItem;
    var btnEnabled = true;
    var mergeFeatures;
    var activeEntity;
    var heartBeatTimer;
    var isProcessingReview = false;
    var getFeatureTimer;

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
            .html('<div class="margin2 inline _loadingSmall"><span></span></div>' + '<span class="strong">Checking for conflicts&#8230;</span>');
        return Review;
    };
    Conflict.highlightLayerTable = null;
    Conflict.startReview = function (data) {
        var entity;
        var mapid = data.mapId;
        var reviewItems = data.reviewableItems;
        var reviewCount = reviewItems.length;
        var index = 0;
        var lastIndex = 0;
        Conflict.reviews = data;


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
            if (zoom < 16) {
                zoom = 16;
            }
            map.centerZoom(extent.center(), (zoom));
        }
        
        function panToEntity(entity) {
        	//only pan if feature is not on screen
        	var map = context.map();
        	var entityExtent = entity.extent(context.graph())? entity.extent(context.graph()) : undefined;
        	var mapExtent = map.extent();
        	var entityCenter = entityExtent.center();
        	        	            
        	if(entityExtent == undefined){
        		alert("Could not locate selected feature with id: " + entity.id + ".")
        		return;
        	}
        	
        	if(_.isEmpty(_.filter(context.intersects(mapExtent),function(n){return n.id==entity.id;}))){
            	var zoom = Math.min(20, map.zoom());
                if (zoom < 16) {
                    zoom = 16.01;
                }
            	map.centerZoom(entityCenter,(zoom));	
        	}
        }
        
        var jumpFor = function (nReviewed, itemCnt) {
            // allow other to use
            //resetReviewStatus();
            lastIndex = index;
            index++;
            if (index === (reviewCount + 1)) {
                index = 1;
            }
            // we have entity with same id but different against

            jumpTo(nReviewed, itemCnt, 'forward');
        };
        var jumpBack = function (nReviewed, itemCnt) {
            // allow other to use
            //resetReviewStatus();
            lastIndex = index;
             index--;
             if (index === 0) {
                 index = reviewCount;
             }
            //updateMeta(index);
            // we have entity with same id but different against

            jumpTo(nReviewed, itemCnt, 'backward');
       };

        // send heartbeat to service so it know the session still exists and target is
        // still being reviewed.
        var updateReviewStatus = function(callback) {
            var targetEntity = reviewItems[index - 1];
            var heartBeatData = {};
            heartBeatData.mapId = mapid;
            heartBeatData.reviewid = targetEntity.uuid;
            heartBeatData.reviewAgainstUuid = targetEntity.itemToReviewAgainst.uuid;

            Hoot.model.REST('reviewUpdateStatus', heartBeatData, function (error, response) {

                if(error){
                    clearInterval(heartBeatTimer);
                    alert('failed to update review status.');
                       return;
                }
                if(callback){
                    callback(response);
                }
            });
        };

        var resetReviewStatus = function(callback) {

            if(lastIndex > 0){

                var targetEntity = reviewItems[lastIndex - 1];
                var resetData = {};
                resetData.mapId = mapid;
                resetData.reviewid = targetEntity.uuid;
                resetData.reviewAgainstUuid = targetEntity.itemToReviewAgainst.uuid;

                Hoot.model.REST('reviewResetStatus', resetData, function (error, response) {
                    if(error){
                       alert('failed reset review status.');

                    }
                    if(callback){
                        callback(error, response);
                    }


                });
            } else {

                if(callback){
                        callback();
                    }
            }

        };
        var jumpTo = function (nReviewed, itemCnt, direction, jumptoidx) {

            if(heartBeatTimer){
                clearInterval(heartBeatTimer);
            }
            d3.select('div.tag-table').remove();

            entity = reviewItems[index - 1];
            var reviewData = {};

            // nReviewed is undefined for very first item
            reviewData.offset = -1;
            var offsetIdx = lastIndex;
            if(jumptoidx !== undefined) {
                offsetIdx = jumptoidx;
            }
            if(nReviewed !== undefined && index > 1){
                reviewData.offset = offsetIdx-1;
                var lastEnt = reviewItems[offsetIdx - 1];
                reviewData.uuid = lastEnt.uuid;
                reviewData.reviewAgainstUuid = lastEnt.itemToReviewAgainst.uuid;
            }

            reviewData.direction = direction;

            reviewData.mapId = mapid;

            resetReviewStatus(function(err, resp){
                if(err)
                {
                    isProcessingReview = false;
                    return;
                }

                Hoot.model.REST('reviewGetNext', reviewData, function (error, response) {

                    if(response.status == 'success') {
                        var nextEntity = null;
                        for(var i=0; i<reviewItems.length; i++){
                            var itm = reviewItems[i];
                            if(itm.uuid == response.nextitemid){
                                var isAgainstMatch = true
                                if(response.nextagainstitemid ) {
                                    isAgainstMatch = (itm.itemToReviewAgainst.uuid == response.nextagainstitemid);
                                }
                                if(isAgainstMatch === true){
                                    nextEntity = itm;
                                    index = i+1;
                                    break;
                                }

                            }
                        }
                        if(nextEntity) {
                            updateReviewStatus(function(response){
                                var lockPeriod = 150000;
                                // we will refresh lock at half of service lock length
                                if(response.locktime){
                                    lockPeriod = (1*response.locktime)/2;
                                }

                                heartBeatTimer = setInterval(function() {
                                    updateReviewStatus();
                                }, lockPeriod);

                                updateMeta(nReviewed, itemCnt);
                                activeConflict = reviewItemID(nextEntity);
                                activeConflictReviewItem = reviewAgainstID(nextEntity);
                                panToBounds(nextEntity.displayBounds);
                                activeEntity = nextEntity;
                                highlightLayer(nextEntity);

                            });
                        }

                    } else {
                        alert("All review items are being reviewed by other users!")
                    }

                    isProcessingReview = false;
                });
            });


        };

        var resetStyles = function () {
            d3.selectAll('path').classed('activeReviewFeature', false);
            d3.selectAll('path').classed('activeReviewFeature2', false);
        };
        var highlightLayer = function (item) {
            //console.log(item);
            var idid = reviewItemID(item);
            var idid2 = reviewAgainstID(item);
            var feature, againstFeature;
            var max = 4;
            var calls = 0;
            var loadedMissing = false;
            clearInterval(getFeatureTimer);
            getFeatureTimer = setInterval(function () {
                if (calls < max) {
                    getFeature();
                    calls++;
//                } else if (loadedMissing) {
//                    getFeatureStopTimer(true);
//                    window.alert('One feature involved in this review was not found in the visible map extent');
                } else {
                    //Make a call to grab the individual feature
                    context.connection().loadMissing([idid, idid2], function(err, entities) {
                        //console.log(entities);
                        //loadedMissing = true;
                        //calls = 0;
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

                    });
                }
            }, 500);
            var getFeatureStopTimer = function (skip) {
                clearInterval(getFeatureTimer);
                if (!skip) {
                    //Merge currently only works on nodes
                    if (feature.id.charAt(0) === 'n' && againstFeature.id.charAt(0) === 'n') {
                        //Show merge button
                        d3.select('a.merge').classed('hide', false);
                        //Override with current pair of review features
                        mergeFeatures = function() {
                            context.hoot().model.conflicts.autoMergeFeature(feature, againstFeature, mapid);
                        };
                        function loadArrow(d) {
                            if (d3.event) d3.event.preventDefault();
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
                    if (feature) {
                        d3.selectAll('.activeReviewFeature')
                            .classed('activeReviewFeature', false);
                        d3.selectAll('.' + feature.id)
                            .classed('activeReviewFeature', true);
                    }
                    if (againstFeature) {
                        d3.selectAll('.activeReviewFeature2')
                            .classed('activeReviewFeature2', false);
                        d3.selectAll('.' + againstFeature.id)
                            .classed('activeReviewFeature2', true);
                    }
                    buildPoiTable(d3.select('#conflicts-container'), [feature, againstFeature]);
                    var note = d3.select('.review-note');
                    note.html(note.html().replace('Review note: ', 'Review note: ' + feature.tags['hoot:review:note']));
                    event.zoomToConflict(feature ? feature.id : againstFeature.id);
                }
            };
            var getFeature = function () {
                feature = context.hasEntity(idid);
                //console.log(feature);
                if (!feature) {
                    idid = context.hoot().model.conflicts.findDescendent(idid);
                    if (idid) feature = context.hasEntity(idid);
                }

                againstFeature = context.hasEntity(idid2);
                //console.log(againstFeature);
                if (!againstFeature) {
                    idid2 = context.hoot().model.conflicts.findDescendent(idid2);
                    if (idid2) againstFeature = context.hasEntity(idid2);
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
                    if (item.itemToReviewAgainst.type === 'relation') {
                        //Hide merge button
                        d3.select('a.merge').classed('hide', true);
                        //Override with no-op
                        mergeFeatures = function() {};
                        getFeatureStopTimer();
                        //window.alert('The review against feature is a relation');
                    } else if (context.changes().deleted.some(
                        function(d) {
                            return d.id === idid || d.id === idid2;
                        })
                    ) {
                        getFeatureStopTimer(true);
                        window.alert('One feature involved in this review has already been deleted');
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
                    r.append('td').classed('f1', true).text(d.value[0]).on('click', function(d){
                        var sel = iD.modes.Select(context, [feats[0].id]);
                        panToEntity(context.entity(feats[0].id));
                        sel.suppressMenu(true);
                        context.enter(sel);
                    });
                    r.append('td').classed('f2', true).text(d.value[1]).on('click', function(d){
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
            // if(item.type=='relation'){window.alert('cant do relations yet');return}
            var a = {
                way: 'w',
                node: 'n',
                relation: 'r'
            };
            return a[item.type] + item.id + '_' + mapid;
        };
        var reviewAgainstID = function (item) {
            //if(item.type=='relation'){window.alert('cant do relations yet');return}
            var a = {
                way: 'w',
                node: 'n',
                relation: 'r'
            };
            return a[item.itemToReviewAgainst.type] + item.itemToReviewAgainst.id + '_' + mapid;
        };

        var done = false;
        function acceptAll() {
            Hoot.model.REST('ReviewGetLockCount', data.mapId, function (resp) {
                var doProceed = true;
                    //if only locked by self
                if(resp.count > 1) {

                    var r = confirm("Reviews are being reviewed by other users." +
                    " Modified features will be saved but will not be marked as resolved. Do you want to continue? ");
                    doProceed = r;
                }


                if(doProceed === true) {
                    done=true;
                    resetStyles();
                    d3.select('div.tag-table').remove();
                    var remaining = reviewsRemaining();
                    _.each(remaining, function (item) {
                        item.retain = true;
                        item.reviewed = true;
                    });
                    // finalize
                    metaHead.text('Saving Conflicts.....');
                    Conflict.reviewComplete();
                    d3.select('.hootTags').remove();
                    event.acceptAll(data);
                }
            });


        }


        function discardAll() {


            Hoot.model.REST('ReviewGetLockCount', data.mapId, function (resp) {
                var doProceed = true;
                    //if only locked by self
                if(resp.count > 1) {

                    var r = confirm("Reviews are being reviewed by other users." +
                    " Modified features will be saved but will not be marked as resolved. Do you want to continue? ");
                    doProceed = r;
                }

                if(doProceed === true) {
                    resetStyles();
                    d3.select('div.tag-table').remove();
                    Conflict.reviewComplete();
                    d3.select('.hootTags').remove();
                    metaHead.text('Discarding Conflicts.....');
                    event.discardAll(data);
                }
            });

        }


       /*
       var statusCheck = function () {
            var numLeft = reviewsRemaining('count');
            if (!numLeft) {
                //saveOptions();
                //metaHead.text('All Conflicts Resolved!');

                metaHead.text('Saving Conflicts.....');
                Conflict.reviewComplete();
                done=true;
                acceptAll();
                d3.select('.hootTags').remove();
                event.acceptAll(data);
                return false;
            }
            return true;
        };*/

         var statusCheck = function () {
            var numLeft = reviewsRemaining('count');
            if (!numLeft) {
                acceptAll();
                return false;
            }
            return true;
        };

        function updateMeta(nReviewed, itemCnt) {
            var numLeft = reviewsRemaining('count');

            var cur_entity = reviewItems[index - 1];
            var entity_stat = 'Unreviewed';
            if(cur_entity.reviewed === true){
                entity_stat = 'Reviewed and ';
                if(cur_entity.retain === true){
                    entity_stat += ' accepted';
                } else if(cur_entity.retain === false){
                    entity_stat += ' discarded';
                }
            }

            var multiFeatureMsg = '';
            if(itemCnt > 1){
              multiFeatureMsg = ', One to many feature ( reviewed ' + (nReviewed) + ' of ' + itemCnt + ')';
            }
            meta.html('<strong class="review-note">' + 'Review note: <br>' + 'Reviewable conflict '+ index + ' of ' + reviewCount + ': ' + entity_stat +
                '  (Remaining conflicts: ' + numLeft +  multiFeatureMsg + ')</strong>');
        }
        var reviewsRemaining = function (count) {
            var features = _.filter(reviewItems, function (d) {
                return !d.reviewed;
            });
            if (count) {
                return features.length;
            }
            else {
                return features;
            }
        };
        var vischeck = function(){
            var layers=context.hoot().model.layers.getLayers();
            var vis = _.filter(layers, function(d){return d.vis;});
            if(vis.length>1){window.alert('Swap to Conflated Layer before accepting!');return false;}
            return true;

        };

        var getMultiReviewItemInfo = function() {
            var nReviewed = 0;
            var itemCnt = 0;
            var iItem = 0;

            var nextItem = reviewItems[index];
            if(nextItem){
                _.each(reviewItems, function(r){
                    if(r.id === nextItem.id){
                        itemCnt++;
                    }
                });
                if(itemCnt > 1){
                    _.all(reviewItems, function(r){

                        if(r.id === nextItem.id){
                            if(r.reviewed === true && iItem < index){
                                nReviewed++;
                            }
                            if(iItem >= index){
                                return false;
                            }
                        }
                        iItem++;
                        return true;
                    });
                }

            }

            var ret = {};
            ret.nReviewed = nReviewed;
            ret.itemCnt = itemCnt;

           return ret;
        };


        var traverseForward = function () {
            var vicheck = vischeck();
            if(!vicheck){return;}

            var multiItemInfo = getMultiReviewItemInfo();

            jumpFor(multiItemInfo.nReviewed, multiItemInfo.itemCnt);
        };

        var traverseBackward = function () {
            var vicheck = vischeck();
            if(!vicheck){return;}

            var multiItemInfo = getMultiReviewItemInfo();
            jumpBack(multiItemInfo.nReviewed, multiItemInfo.itemCnt);
        };



        var traverseTo = function (toIdx) {
            lastIndex = index;
            index = toIdx * 1;
            var vicheck = vischeck();
            if(!vicheck){return;}


            var multiItemInfo = getMultiReviewItemInfo();
            jumpTo(multiItemInfo.nReviewed, multiItemInfo.itemCnt, 'forward', index);
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

        var retainFeature = function () {
            if(isProcessingReview === true){
                alert("Processing review. Please wait.");
                return;
            }
            isProcessingReview = true;
            var vicheck = vischeck();
            if(!vicheck){
                isProcessingReview = false;
                return;
            }
            var item = reviewItems[index - 1];


            var contains = item.reviewed;
            if (contains) {
                window.alert('Item Is Already Resolved!');

            } else {
              item.retain = true;
                item.reviewed = true;
                var itemKlass = reviewItemID(item);
                var itemKlass2 = reviewAgainstID(item);
                d3.selectAll('.' + itemKlass)
                    .classed('activeReviewFeature', false);
                d3.selectAll('.' + itemKlass2)
                    .classed('activeReviewFeature2', false);
                d3.select('div.tag-table').remove();
            }

            var stat = statusCheck();
            if (!stat) {
                isProcessingReview = false;
                return;
            }

            var reviewedItems = {};
            var reviewedItemsArr = [];

            var markItem = {};
            markItem['id'] = item.id;
            markItem['type'] = item.type;
            markItem['reviewedAgainstId'] = item.itemToReviewAgainst.id;
            markItem['reviewedAgainstType'] = item.itemToReviewAgainst.type;
            reviewedItemsArr.push(markItem);
            reviewedItems['reviewedItems'] = reviewedItemsArr;

            var reviewMarkData = {};
            reviewMarkData.mapId = mapid;
            reviewMarkData.reviewedItems = reviewedItems;
            
            var hasChanges = context.history().hasChanges();
            if (hasChanges) {
              var changes = context.changes(iD.actions.DiscardTags(context.history().difference()));
              var changesetXml = JXON.stringify(context.connection().osmChangeJXON('-1', changes));
              reviewMarkData.reviewedItemsChangeset = changesetXml;
                Hoot.model.REST('ReviewMarkItem', reviewMarkData, function (error, response) 
                {
                  var multiItemInfo = getMultiReviewItemInfo();
                  jumpFor(multiItemInfo.nReviewed, multiItemInfo.itemCnt);
                      
                  var xmlParser = new DOMParser();
                  var changesetDoc = 
                	xmlParser.parseFromString(response.changesetUploadResponse, "text/xml");
                  context.hoot().model.conflicts.updateDescendent(changesetDoc, response.mapId);
                  context.flush();
                  //context.history().clearSaved();
                  context.enter(iD.modes.Browse(context));
                });
            } 
            else {
                Hoot.model.REST('ReviewMarkItem', reviewMarkData, function () {

                    var multiItemInfo = getMultiReviewItemInfo();
                    jumpFor(multiItemInfo.nReviewed, multiItemInfo.itemCnt);

                });
            }
            
            
        };

        function toggleForm(self) {
            var cont = self.select('fieldset');
            var text = (cont.classed('hidden')) ? false : true;
            cont.classed('hidden', text);
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
            head.classed('button dark animate strong block _icon big disk pad2x pad1y js-toggle white', true)
                .style('text-align','center')
                .style('color','#fff')
                .text('Save')
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    toggleForm(Review, this);
                });



        confData.isDeleteEnabled = true;
        if (!reviewCount) {
            var txt;
            if (reviewCount === 0) {
                txt = 'There are 0 Conflicts!';
            }
            else {
                txt = 'Fail Reviewing';
            }
            metaHead.text(txt);
            reviewOptions = Review.selectAll('fieldset');
            reviewOptions.append('div')
                .classed('form-field pill col12', true);
            reviewOptions.append('input')
                .attr('type', 'submit')
                .attr('value', 'Export Data')
                .classed('fill-dark round pad0y pad2x dark small strong space-bottom0 margin0 conflictSaveOptions', true)
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    //event.removeConflicts();
                    event.exportData();
                });
            reviewOptions.append('input')
                .attr('type', 'submit')
                .attr('value', 'Add Another Dataset')
                .classed('fill-dark round pad0y pad2x dark small strong space-bottom0 margin0 conflictSaveOptions', true)
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    //event.keepConflicts();
                    event.addData();
                });
            return;
        }


        if (data.numItemsReturned) {
          confData.isDeleteEnabled = false;

            metaHead.text('There are ' + data.numItemsReturned + ' conflicts:');
            reviewOptions = Review.selectAll('fieldset')
                .append('div')
                .classed('col12 space-bottom1', true);
            metaHeadDiscard = reviewOptions.append('div')
                .classed('small keyline-left keyline-top keyline-right round-top hoverDiv', true)
                .append('label')
                .classed('pad1x pad1y', true)
                .append('a')
                .attr('href', '#')
                .text('Discard all conflicts')
                .on('click', function () {

                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    discardAll();

                });
            metaHeadAccept = reviewOptions.append('div')
                .classed('small keyline-all round-bottom space-bottom1', true)
                .append('label')
                .classed('pad1x pad1y', true)
                .append('a')
                .attr('href', '#')
                .text('Accept all conflicts')
                .on('click', function () {

                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    acceptAll();
                });
        }

        var conflicts = d3.select('#content')
            .append('div')
            .attr('id', 'conflicts-container')
            .classed('pin-bottom review-block unclickable', true)
            .append('div')
            .classed('conflicts col12 fillD pad1 space clickable', true)
            //.style('height','90px') //changed from 133px to avoid conflict with footer
            .data(reviewItems);
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
//        }, {
//            name: confData.layers[0],
//            text: 'Discard',
//            color: 'loud-red',
//            icon: '_icon x',
//            action: removeFeature
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
                window.alert('Please wait. Processing review.');
              }

            })
            .call(tooltip);

        var _gotoConflict = function() {
            var idx = d3.select('#conflict_idx').value();

            if(isNaN(idx) || (idx*1) > reviewCount || (idx*1) < 1) {
                window.alert ('Please enter value in range of: 1 - ' + reviewCount );
                d3.select(this).value(index);
                return;
            }
            // We need this delay for iD to have time to add way for adjusting
            // graph history. If you click really fast, request out paces the process
            // and end up with error where entity is not properly deleted.
            setTimeout(function () {
                btnEnabled = true;
            }, 500);
            if(btnEnabled){
                btnEnabled = false;
                traverseTo(idx-1);
            } else {
                window.alert('Please wait. Processing review.');
            }
        };


        opts.append('a')
            .attr('href', '#')
            .text('Go')
            .style('background-color', 'loud')
            .style('color', '#fff')
            .style('margin-right', '50px')
            .attr('class', function () {
                return 'fr inline button dark loud pad0y pad2x keyline-all ';
            })
            .on('click', function () {

                _gotoConflict();

            });

            var idxInput = opts.append('input')
                .style('width', '40px')
                .attr('id', 'conflict_idx')
                .attr('type', 'text')
                .attr('class', 'fr inline')
                .attr('onkeypress','return event.charCode >= 48 && event.charCode <= 57');

            idxInput.on('keyup', function () {
                if(d3.event.keyCode === 13){
                    _gotoConflict();
                }
            });

        Conflict.highlightLayerTable = highlightLayer;
        jumpFor();
    };






    Conflict.reviewNextStep = function () {

      confData.isDeleteEnabled = true;
        metaHead.text('All Conflicts Resolved!');

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
    return d3.rebind(Conflict, event, 'on');
};
