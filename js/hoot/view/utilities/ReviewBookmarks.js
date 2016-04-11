/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.ui.reviewbookmarks is container of all review book marks.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      02 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.view.utilities.reviewbookmarks = function(context) {
	var _instance = {};
    var _lastSortRequest;
    var _DEFAULT_PAGE_COUNT = 50;
    var _currentPage = 1;

    /**
    * @desc Creates container for bookmarks list.
    * @param form - parent form.
    **/
    _instance.createContent = function(form){

        var hd = form.append('div')       
                    .classed('col12 fill-white small keyline-bottom', true);
        var sortSpan = hd.append('span')
                    .classed('text-left big col12 fill-darken0', true);
        var aa = sortSpan.append('a');
      
        _createSortMenu(form, aa);
        _createFilterByCreatorMenu(form, aa);
        _createFilterByMapIdMenu(form, aa);
        

        _instance.datasetcontainer = form.append('div')
            .attr('id', 'reviewBookmarksContent')
            .classed('col12 fill-white small  row16 overflow keyline-all', true)
            .call(_instance.populatePopulateBookmarks);

            context.hoot().view.utilities.on('tabToggled', function(d){
                if(d === '#utilReviewBookmarks') {
                    _instance.populatePopulateBookmarks(null, null);
                }
            });






        var btnContainer = form.append('div')
                .attr('id', 'bmkPageBtnContainer')
                .classed('form-field col12', true);

        var btnPrevPageContainer = btnContainer.append('div')
                .attr('id', 'btnPrevPageContainer')
                .classed('form-field col1 pad1y pad1x ', true);


                
                 btnPrevPageContainer.append('span')
                .classed('strong center col12 ', true)
                .classed('row1 keyline-all', true)
                .text("Prev")
                .on('click', function(){

                    var prevBtn = d3.select('#bmkPageBtn' + (_currentPage - 1));
                    if(prevBtn && !prevBtn.empty()) {
                        _currentPage--;
                        _populateCurrentPage();
                    }

                });

        var btnNextPageContainer = btnContainer.append('div')
                .attr('id', 'btnNextPageContainer')
                .classed('form-field col1 pad1y pad1x ', true);

                 btnNextPageContainer.append('span')
                .classed('strong center col12 ', true)
                .classed('row1 keyline-all', true)
                .text("Next")
                .on('click', function(){
                    var nextBtn = d3.select('#bmkPageBtn' + (_currentPage + 1));
                    if(nextBtn && !nextBtn.empty()) {
                        _currentPage++;
                        _populateCurrentPage();
                    }
                });

        var btnNumsContainer = btnContainer.append('div')
                .attr('id', 'bmkPageNumBtnContainer')
                .classed('form-field col10 pad1y pad1x overflow', true);

   


    };

    /**
    * @desc Helper function for handling closing sort menu when user clicks outside of menu.
    **/
   var _globalSortClickHandler = function(a){
        var self = d3.select('#reviewMenuForm' + 'reviewBookmarksSortDiv');
        if(!self.empty()) {
            self.remove();
        }
    }

    /**
    * @desc Creates menu button.
    * @param form - container form (NOT USED)
    * @param menuDivName - div id for this.
    * @param displayText - menu name
    * @param meta - meta data for menu dialog
    * @param menuContainer - container div
    **/
    var _createMenu = function(form, menuDivName, displayText, meta, menuContainer, callback) {
        
        var dd = menuContainer.append('div')
        .attr('id', menuDivName)
        .classed('fr quiet col1 center',true)


        .on('click', function(d, e, f){
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var self = d3.select('#reviewMenuForm' + menuDivName);
            if(!self.empty()) {
                self.remove();
            } else {
                callback(menuDivName, meta);
            }
            
        });


        dd.append('span')
        .classed('quiet',true)
        .text(displayText);

        dd.append('span')
        .classed('_icon down quiet', true);

    }

    /**
    * @desc Sorts list .
    * @param field - order by field
    * @param order - [asc | dsc]
    **/
    var _sortData = function(field, order) {

        _lastSortRequest['orderBy'] = field;
        _lastSortRequest['asc'] = order;
        _lastSortRequest['limit'] = _DEFAULT_PAGE_COUNT;
        _lastSortRequest['offset'] = 0;
        _instance.populatePopulateBookmarks(null, _lastSortRequest);
        _globalSortClickHandler();
    }

    /**
    * @desc Sort menu popup.
    * @param form - container
    * @param menuContainer - pass through for menu container
    **/
    var _createSortMenu = function(form, menuContainer) {
        var data = [
            {'name': 'Created At (asc)', 'action':function(){_sortData('createdAt', 'true');}},
            {'name': 'Created At (dsc)', 'action':function(){_sortData('createdAt', 'false');}},
            {'name': 'Created By (asc)', 'action':function(){_sortData('createdBy', 'true');}},
            {'name': 'Created By (dsc)', 'action':function(){_sortData('createdBy', 'false');}},
            {'name': 'Modified At (asc)', 'action':function(){_sortData('lastModifiedAt', 'true');}},
            {'name': 'Modified At (dsc)', 'action':function(){_sortData('lastModifiedAt', 'false');}},
            {'name': 'Modified By (asc)', 'action':function(){_sortData('lastModifiedBy', 'true');}},
            {'name': 'Modified By (dsc)', 'action':function(){_sortData('lastModifiedBy', 'false');}},
            {'name': 'Review ID (asc)', 'action':function(){ _sortData('id', 'true');}},
            {'name': 'Review ID (dsc)', 'action':function(){ _sortData('id', 'false');}},
            {'name': 'Map ID (asc)', 'action':function(){ _sortData('mapId', 'true');}},
            {'name': 'Map ID (dsc)', 'action':function(){ _sortData('mapId', 'false');}},
            {'name': 'Relation ID (asc)', 'action':function(){ _sortData('relationId', 'true');}},
            {'name': 'Relation ID (dsc)', 'action':function(){ _sortData('relationId', 'false');}},
        ];
        var meta = {};
        meta.title = 'Sort By';
        meta.data  = data;

        document.body.removeEventListener('click', _globalSortClickHandler ); 
        document.body.addEventListener('click', _globalSortClickHandler ); 
        _createMenu(form, 'reviewBookmarksSortDiv', 'Sort', meta, menuContainer, function(divName, m){
            context.hoot().ui.hootformreviewmarkmenu.createForm(divName, m);
        });
    }

    /**
    * @desc Helper function for handling closing filter menu when user clicks outside of menu.
    * @TODO: Filter and sort should be refactored into one..
    **/
    var _globalFilterByCreatorClickHandler = function(a){
        var self = d3.select('#reviewMenuForm' + 'reviewBookmarksFilterByCreatorDiv');
        if(!self.empty()) {
            self.remove();
        }
    }

    /**
    * @desc Filter list .
    * @param d - filter data
    **/

    var _filterData = function(d) {
        
        _lastSortRequest['filterby'] = 'createdBy';
        _lastSortRequest['filterbyval'] = d.id;
        _instance.populatePopulateBookmarks(null, _lastSortRequest);
        _globalFilterByCreatorClickHandler();
    }

    /**
    * @desc Filter menu popup.
    * @param form - container
    * @param menuContainer - pass through for menu container
    **/
    var _createFilterByCreatorMenu = function(form, menuContainer) {

        
        var data = _generateUsersData();
        
        var meta = {};
        meta.title = 'Filter By Created By';
        meta.data  = data;

        document.body.removeEventListener('click', _globalFilterByCreatorClickHandler ); 
        document.body.addEventListener('click', _globalFilterByCreatorClickHandler ); 
        // we have callback to data gets refreshed whenever we press button
        _createMenu(form, 'reviewBookmarksFilterByCreatorDiv', 'Creator', meta, menuContainer, function(divName, m){
            var d = _generateUsersData();
            m.data = d;
            context.hoot().ui.hootformreviewmarkmenu.createForm(divName, m);
        });
    }



    /**
    * @desc Help function to generate users meta data
    **/
    var _generateUsersData = function() {
        var usersList = iD.data.hootConfig.usersRaw;
        var data = [];

        var newobj = {};
        newobj.name = 'anonymous';
        newobj.id = -1;
        newobj.displayName = 'anonymous';
        newobj.action = function(d){_filterData(d);}
        data.push(newobj);

        for(var i=0; i<usersList.length; i++) {
            var usr = usersList[i];

            var newobj = {};
            newobj.name = usr.email;
            newobj.id = usr.id;
            newobj.displayName = usr.displayName;
            newobj.action = function(d){_filterData(d);}
            data.push(newobj);
        }

        return data;
    }


    /**
    * @desc Helper function for handling closing filter menu when user clicks outside of menu.
    * @TODO: Filter and sort should be refactored into one..
    **/
    var _globalFilterByMapIdClickHandler = function(a){
        var self = d3.select('#reviewMenuForm' + 'reviewBookmarksFilterByMapIdDiv');
        if(!self.empty()) {
            self.remove();
        }
    }

    /**
    * @desc Filter list .
    * @param d - filter data
    **/

    var _filterByMapIdData = function(d) {
        
        _lastSortRequest['filterby'] = 'mapId';
        _lastSortRequest['filterbyval'] = d.id;
        _instance.populatePopulateBookmarks(null, _lastSortRequest);
        _globalFilterByMapIdClickHandler();
    }

    /**
    * @desc Filter menu popup.
    * @param form - container
    * @param menuContainer - pass through for menu container
    **/
    var _createFilterByMapIdMenu = function(form, menuContainer) {

        
        var data = _generateLayerData();
        
        var meta = {};
        meta.title = 'Filter By Layers';
        meta.data  = data;

        document.body.removeEventListener('click', _globalFilterByMapIdClickHandler ); 
        document.body.addEventListener('click', _globalFilterByMapIdClickHandler ); 
        // we have callback to data gets refreshed whenever we press button
        _createMenu(form, 'reviewBookmarksFilterByMapIdDiv', 'Layers', meta, menuContainer, function(divName, m){
            var d = _generateLayerData();
            m.data = d;
            context.hoot().ui.hootformreviewmarkmenu.createForm(divName, m);
        });
    }



    var _generateLayerData = function() {
        var curLayers = context.hoot().model.layers.getAvailLayers();

        var data = [];

        for(var i=0; i<curLayers.length; i++) {
            var lyr = curLayers[i];

            var newobj = {};
            newobj.name = lyr.name;
            newobj.id = lyr.id;
            newobj.action = function(d){_filterByMapIdData(d);}
            data.push(newobj);
        }

        return data;

    }


    /**
    * @desc Button for page.
    **/
    var _pageBtnClickHandler = function() {

        _currentPage = (1*d3.select(this).text());
        _populateCurrentPage();
    }

    /**
    * @desc Populates selected page.
    **/
    var _populateCurrentPage = function() {
        var offset = (_currentPage-1) * _DEFAULT_PAGE_COUNT;
        _lastSortRequest['offset'] = offset;
        _instance.populatePopulateBookmarks(null, _lastSortRequest);
    }

    /**
    * @desc Populates bookmarks list.
    * @param container - container
    * @param overrideReq - override request which may contain saved sort or filter values
    **/
	_instance.populatePopulateBookmarks = function(container, overrideReq) {
            if(!container){
                container = _instance.datasetcontainer;
            }

            context.hoot().getAllusers(function(r){

                _lastSortRequest = {};
                _lastSortRequest['orderBy'] = 'createdAt';
                _lastSortRequest['asc'] = 'false';
                _lastSortRequest['limit'] = _DEFAULT_PAGE_COUNT;
                _lastSortRequest['offset'] = 0;
                if(overrideReq) {
                    _lastSortRequest = overrideReq;
                }

                Hoot.model.REST('getReviewBookmarkStat', null, function (resp) {
                    if(resp.error){
                        context.hoot().view.utilities.errorlog.reportUIError(d.error);
                        return;
                    }

                    var total = 1*resp.totalCount;
                    var nPages = Math.ceil(total/_DEFAULT_PAGE_COUNT);

                    var pgBtnContainer = d3.select('#bmkPageNumBtnContainer');
                    // Clean since each time setting tab item is click we refresh
                    pgBtnContainer.selectAll('span').remove();
                    for(var i=1; i<=nPages; i++) {
                        pgBtnContainer.append('span')
                        .attr('id', 'bmkPageBtn' + i)
                        .classed('strong center col0 ', true)
                        .classed('row1 keyline-all', true)
                        .text(i)
                        .on('click', _pageBtnClickHandler);

                    }

                    d3.select('#bmkPageBtn' + _currentPage).classed('loud',true);

                    Hoot.model.REST('getAllReviewBookmarks', _lastSortRequest, function (d) {
                        if(d.error){
                            context.hoot().view.utilities.errorlog.reportUIError(d.error);
                            return;
                        }

                       
                        var bookmarksArray = d.reviewBookmarks;
                 
            
                        container.selectAll('div').remove();
                        var tla = container.selectAll('div')
                            .data(bookmarksArray)
                            .enter();
                        var tla2 = tla.append('div')
                            .classed('col12 fill-white small keyline-bottom hoverDiv2', true);
                        var tla3 = tla2.append('span')
                            .classed('text-left big col12 strong', true)
                            .append('a')
                            .text(_renderLinkText)
                            .on('click', _linkClickHandler);

                        var tla22 = tla2.append('div')
                            .classed('col12 small keyline-bottom', true);

                        tla22.append('span')
                            .classed('text-left big col12 quiet', true)

                            .text(_createSubText);
                       
                        tla3.append('button')
                        //.classed('keyline-left keyline-right fr _icon trash pad2 col1', true)
                        .style('height', '100%')
                        .on('click', _deleteBtnHandler)
                        .select(function (sel) {
                            d3.select(this).classed('fr _icon trash', true);
                        });

                       
                    });

                });



            });
            
            
                
    };

   
    
    /**
    * @desc Shows the bookmark item main link text.
    * @param d - bookmark item data
    **/
    var _renderLinkText = function(d) {
        var lyrName = context.hoot().model.layers.getNameBymapId(d.mapId);
        var rfid = 'r'+d.relationId + '_' + d.mapId;
        var bkmDetail = d.detail['bookmarkdetail'];

        return bkmDetail.title + ': ' + bkmDetail.desc + ' - [' + lyrName + ':' + rfid + ']';
    }

    /**
    * @desc Link click handler which should show notes page.
    * @param d - bookmark item data
    **/
    var _linkClickHandler = function(d) {
        context.hoot().view.utilities.reviewbookmarknotes.setCurrentBookmarkId(d.id);
        context.hoot().view.utilities.reviewbookmarknotes.createContent(d3.select('#containerFormutilReviewBookmarkNotes'));
        var jobsBG = d3.select('#jobsBG');
  
        var thisbody = d3.select('#utilReviewBookmarkNotes')
            .node();
        jobsBG.node()
            .appendChild(thisbody);
        d3.selectAll('.utilHootHead').style('font-weight','normal');
        d3.select('#utilHootHeadDivutilReviewBookmarkNotes').style('font-weight','bold');
    }

    /**
    * @desc Description text for bookmark item.
    * @param d - bookmark item data
    **/
    var _createSubText = function (d) {
        var createdAt = d['createdAt'];
        var createdBy = d['createdBy'];
        var bookmarkId = d['id'];
        var lastModifiedAt = d['lastModifiedAt'];
        var lastModifiedBy = d['lastModifiedBy'];
        var bookmarkMapId = d['mapId'];
        var bookmarkRelId = d['relationId'];

        var date = new Date(createdAt);
        var dateToStr = date.toLocaleString();
        //var cleanDate = dateToStr[2] + ' ' + dateToStr[1] ;
        var createdByEmail = 'anonymous';
        if(createdBy && (1*createdBy) > -1) {
            createdByEmail = iD.data.hootConfig.users[1*createdBy].email;
        }
        var subStr = '#' + bookmarkId + ' created at ' + dateToStr + ' by user ' + createdByEmail;

        if(lastModifiedAt) {
            var lastMddate = new Date(lastModifiedAt);
            var lastMdDateStr = lastMddate.toLocaleString();
            subStr += ' modified at ' + lastMdDateStr;

            var modifiedByEmail = 'anonymous';
            if(lastModifiedBy && (1*lastModifiedBy) > -1) {
                modifiedByEmail = iD.data.hootConfig.users[1*lastModifiedBy].email;
            }

            subStr += ' modified by ' + modifiedByEmail;
        }

        return subStr;
    }

    /**
    * @desc Deletes bookmark.
    * @param d - bookmark item data
    **/
    var _deleteBtnHandler = function(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        

        var r = confirm("Are you sure you want to delete selected bookmark?");
        if (r == true) { 
            _instance.deleteBookmark(d);
        } else {
            return;
        }
    }

    /**
    * @desc Calls delete handler
    * @param d - bookmark item data
    **/
    _instance.deleteBookmark = function(d) {
        request = {};
        request['bookmarkId'] = d.id;

        Hoot.model.REST('deleteReviewBookmark', request, function (d) {
            if(d.error){
                context.hoot().view.utilities.errorlog.reportUIError(d.error);
                return;
            }
            _instance.populatePopulateBookmarks(null, _lastSortRequest);           
        });
    }


	return _instance;
}