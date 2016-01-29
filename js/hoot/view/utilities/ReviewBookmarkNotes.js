Hoot.view.utilities.reviewbookmarknotes = function(context){
    var _events = d3.dispatch();
    var _instance = {};

    var _bookmarkId;
    var _currentBookmark;
    var _forcedReviewableItem;
    var _currentNotes;

    _instance.getForcedReviewableItem = function() {
        return _forcedReviewableItem;
    }

    _instance.setForcedReviewableItem = function(itm) {
        _forcedReviewableItem = itm;
    }


    _instance.createContent = function(form){
      if(!_bookmarkId) {
        return;
      }
      if(!d3.select('#reviewbookmarknotesbody').empty()){
        d3.select('#reviewbookmarknotesbody').remove();
      }

      form.append('div')
      .attr('id','reviewbookmarknotesbody')
          .classed('col12 fill-white small strong row16 overflow keyline-all', true)
          .call(_instance.getNotes);

    };

    _instance.getNotes = function(container) {
      var reqParam = {};
      reqParam.bookmarkId = _bookmarkId;
      Hoot.model.REST('getReviewBookmark', reqParam, function (resp) {   
                
        if(resp && resp.reviewBookmarks && resp.reviewBookmarks.length > 0) {
          _currentNotes= {};
          _currentBookmark = resp.reviewBookmarks[0];
          var noteList = _currentBookmark.detail.bookmarknotes;
          _createHeader(_currentBookmark.detail.bookmarkdetail.title, _currentBookmark.id);

          _createContainerDiv();          
          _appendNotes(noteList);
          _appendNewEmptyNoteForm(noteList);

        }
      });


    }

    _instance.setCurrentBookmarkId = function(bmkId) {
      _bookmarkId = bmkId;
    }


    var _createHeader = function(title, bookmarkId) {
      var mainBar = d3.select('#reviewbookmarknotesbody')
            .append('form')
            .classed('round importableLayer', true);

      var mainBarDiv = mainBar.append('div')
            .classed('big pad0y pad0x col12 keyline-bottom', true);

      
      mainBarDiv.append('div')
            .attr('id', 'bmkNoteHdLabel')
            .classed('fl', true)
            .append('h1')
            .text(title + ' #' + bookmarkId);




      var currentReviewable = _currentBookmark.detail.bookmarkreviewitem;

      var reqParam = {};
      reqParam.mapId = currentReviewable.mapId;
      reqParam.sequence = currentReviewable.sortOrder;
      Hoot.model.REST('reviewGetReviewItem', reqParam, function (resp) {  

          if(resp.error){
              context.hoot().view.utilities.errorlog.reportUIError(d.error);
              return;
          } 

          if(resp.resultCount > 0){
            

            mainBarDiv.append('div')
              .classed('fr icon undo point', true)
              .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                _jumpToReviewItem();
              });


          } else {
            d3.select('#bmkNoteHdLabel').text(title + ' #' + bookmarkId + ' - ( **** RESOLVED **** )');
          }
            
      });


          
    }


    var _jumpToReviewItem = function() {
      _forcedReviewableItem = _currentBookmark.detail.bookmarkreviewitem;

        var reqParam = {};
        reqParam.mapId = _forcedReviewableItem.mapId;
        reqParam.sequence = _forcedReviewableItem.sortOrder;
        Hoot.model.REST('reviewGetReviewItem', reqParam, function (resp) {  

            if(resp.error){
                context.hoot().view.utilities.errorlog.reportUIError(d.error);
                return;
            } 

            if(resp.resultCount < 1){
              alert('The review item already has been resolved. Can not go to review item.');
            } else {
              context.hoot().view.utilities.forceResetManageTab();
              context.hoot().reset();

              
              var key = {
                  'name': context.hoot().model.layers.getNameBymapId(_currentBookmark.mapId),
                  'id':_currentBookmark.mapId,
                  color: 'violet'
              };
              context.hoot().control.import.forceAddLayer(key, d3.select(d3.selectAll('.hootImport')
                .node()), key.color, key.name);
          
            }

              
        });
    }

    var _createContainerDiv = function() {
      d3.select('#reviewbookmarknotesbody')
          .append('div')
          .attr('id','reviewbookmarknotesdiv')
              .classed('col6 fill-white', true);
    }

    var _appendNotes = function(noteList) {
      _currentNotes= {};
      for(var i=0; i<noteList.length; i++) {
        var nt = noteList[i];
        var d_form = [
        {
          label: 'Note',
          id: 'bmkNoteText' + nt.id,
          placeholder:'',
          inputtype:'textarea',
          inputText: nt.note,
          readonly: true
        }];


        var date = new Date(nt.modifiedAt);
        var dateToStr = date.toUTCString();
        var meta = {};
        meta.title = 'User ' + nt.userId + ' commented at ' + dateToStr;
        meta.form = d_form; 
        meta.rawData = nt;
        meta.modifyHandler = _modifyNoteHandler;
        //context.hoot().ui.hootformreviewnote.createForm('reviewbookmarknotesdiv', meta);


        var hootformreviewnote = Hoot.ui.hootformreviewnote();
        hootformreviewnote.createForm('reviewbookmarknotesdiv', meta);
        _currentNotes[nt.id] = hootformreviewnote;

      }
    }

    var _modifyNoteHandler = function(noteMeta) {
      var notes = _currentBookmark.detail.bookmarknotes;

      var modified = _.find(notes, function(n){
        return n.id === noteMeta.id;
      });
    
      if(modified) {
        modified.note = noteMeta.note;
      }

      var reqParam = {};
      reqParam['bookmarkId'] = _currentBookmark.id;
      reqParam['mapId'] = _currentBookmark.mapId;
      reqParam['relationId'] = _currentBookmark.relationId;
      reqParam['userId'] = _currentBookmark.userId;
      reqParam['detail'] = _currentBookmark.detail;

      Hoot.model.REST('saveReviewBookmark', reqParam, function (resp) {   
        _instance.createContent(d3.select('#containerFormutilReviewBookmarkNotes'));
      });
    }


    var _appendNewEmptyNoteForm = function(noteList) {
      var d_form = [
      {
        label: 'Note',
        id: 'bmkNoteTextNew',
        placeholder:'Enter a new comment',
        inputtype:'textarea',
        readonly: false
      }];

      var d_btn = [
        {
          text: 'comment',
          location: 'right',
          onclick: function(){
            var reqParam = {};
            var newNote = d3.select('#bmkNoteTextNew').value();

            var bmNote = {};
            bmNote['userId'] = -1;
            bmNote['note'] = newNote;
            _currentBookmark.detail.bookmarknotes.push(bmNote);

            reqParam['bookmarkId'] = _currentBookmark.id;
            reqParam['mapId'] = _currentBookmark.mapId;
            reqParam['relationId'] = _currentBookmark.relationId;
            reqParam['userId'] = _currentBookmark.userId;
            reqParam['detail'] = _currentBookmark.detail;

            Hoot.model.REST('saveReviewBookmark', reqParam, function (resp) {   
              _instance.createContent(d3.select('#containerFormutilReviewBookmarkNotes'));
            });
            
          }
        }
      ];


      var meta = {};
      meta.title = 'New';
      meta.form = d_form; 
      meta.button = d_btn;
      meta.isNew = true;
      //context.hoot().ui.hootformreviewnote.createForm('reviewbookmarknotesdiv', meta);
      var hootformreviewnote = Hoot.ui.hootformreviewnote();
      hootformreviewnote.createForm('reviewbookmarknotesdiv', meta);
      _currentNotes['new'] = hootformreviewnote;
    }


    

  
    return d3.rebind(_instance, _events, 'on');
}
