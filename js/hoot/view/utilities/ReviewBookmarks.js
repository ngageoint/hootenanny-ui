Hoot.view.utilities.reviewbookmarks = function(context) {
	var _instance = {};


    _instance.createContent = function(form){

      
        _createSortMenu(form);
        

        _instance.datasetcontainer = form.append('div')
            .attr('id', 'reviewBookmarksContent')
            .classed('col12 fill-white small  row10 overflow keyline-all', true)
            .call(_instance.populatePopulateBookmarks);
    };

   var _globalSortClickHandler = function(a){
        var self = d3.select('#reviewMenuForm' + 'reviewBookmarksSortDiv');
        if(!self.empty()) {
            self.remove();
        }
    }
    var _createMenu = function(form, menuDivName, displayText, meta) {
        
        var hd = form.append('div')       
                    .classed('col12 fill-white small keyline-bottom', true);
        var sortSpan = hd.append('span')
                    .classed('text-left big col12 fill-darken0', true);
        var aa = sortSpan.append('a');

        var dd = aa.append('div')
        .attr('id', menuDivName)
        .classed('fr quiet col1 center',true)


        .on('click', function(d, e, f){
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var self = d3.select('#reviewMenuForm' + menuDivName);
            if(!self.empty()) {
                self.remove();
            } else {
                context.hoot().ui.hootformreviewmarkmenu.createForm(menuDivName, meta);
            }
            
        });


        dd.append('span')
        .classed('quiet',true)
        .text(displayText);

        dd.append('span')
        .classed('_icon down quiet', true);

    }


    var _sortData = function(field, order) {
        request = {};
        request['orderBy'] = field;
        request['asc'] = order;
        request['limit'] = 200;
        request['offset'] = 0;
        _instance.populatePopulateBookmarks(null, request);
        _globalSortClickHandler();
    }
    var _createSortMenu = function(form) {
        var data = [
            {'name': 'Created At (asc)', 'action':function(){_sortData('createdAt', 'true');}},
            {'name': 'Created At (dsc)', 'action':function(){_sortData('createdAt', 'false');}},
            {'name': 'Created By (asc)', 'action':function(){_sortData('createdBy', 'true');}},
            {'name': 'Created By (dsc)', 'action':function(){_sortData('createdBy', 'false');}},
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
        _createMenu(form, 'reviewBookmarksSortDiv', 'Sort', meta)
    }

	_instance.populatePopulateBookmarks = function(container, overrideReq) {
            if(!container){
                container = _instance.datasetcontainer;
            }

            request = {};
            request['orderBy'] = 'createdAt';
            request['asc'] = 'false';
            request['limit'] = 200;
            request['offset'] = 0;
            if(overrideReq) {
                request = overrideReq;
            }
            Hoot.model.REST('getAllReviewBookmarks', request, function (d) {
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
    };

   
    

    var _renderLinkText = function(d) {
        var lyrName = context.hoot().model.layers.getNameBymapId(d.mapId);
        var rfid = 'r'+d.relationId + '_' + d.mapId;
        var bkmDetail = d.detail['bookmarkdetail'];

        return bkmDetail.title + ': ' + bkmDetail.desc + ' - [' + lyrName + ':' + rfid + ']';
    }

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


    var _createSubText = function (d) {
        var createdAt = d['createdAt'];
        var createdBy = d['createdBy'];
        var bookmarkId = d['id'];
        var lastModifiedAt = d['lastModifiedAt'];
        var lastModifiedBy = d['lastModifiedBy'];
        var bookmarkMapId = d['mapId'];
        var bookmarkRelId = d['relationId'];

        var date = new Date(createdAt);
        var dateToStr = date.toUTCString();
        //var cleanDate = dateToStr[2] + ' ' + dateToStr[1] ;

        return '#' + bookmarkId + ' created at ' + dateToStr + ' by user ' + createdBy;
    }

    var _deleteBtnHandler = function(d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        
        var r = confirm("Are you sure you want to delete selected translaton?");
        if (r == true) {

        } else {
            return;
        }
    }
	return _instance;
}