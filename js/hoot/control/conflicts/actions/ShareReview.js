Hoot.control.conflicts.actions.sharereview = function (context)
{
	var _events = d3.dispatch();
	var _instance = {};
	var _currentForm;
	var _userInfo = {'id':-1, 'displayName':'anonymous', 'email':''}

	_instance.publish = function(){
		_instance.createDialog();
	}

	_instance.createDialog = function() {
		var userEmail = null;
		if(_userInfo.id > -1) {
			userEmail = _userInfo.email;
		}
		var d_form = [{
	            label: 'Title',
	            id: 'reviewBookmarkTitle',
	            placeholder: '',
	            inputtype:'text'
	        },{
            	label: 'Description',
	            id: 'reviewBookmarkDescription',
	            placeholder: '',
	            inputtype:'text'
            },
            {
            	label: 'Note',
            	id: 'reviewBookmarkNote',
            	placeholder:'',
            	inputtype:'textarea'
            },
            {
	            label: 'Creator Email',
	            id: 'reviewBookmarkCreatorEmail',
	            placeholder: '',
	            inputtype:'text',
	            text: userEmail
	        }];

        var d_btn = [
				        {
				        	text: 'publish',
				        	location: 'right',
				        	onclick: _saveBookmark
				        }
			        ];

        var meta = {};
        meta.title = 'Share Review';
        meta.form = d_form;
        meta.button = d_btn;

		_currentForm = context.hoot().ui.formfactory.create('body', meta);
	}

	var _saveBookmark = function() {
		
		var reqParam = {};
		var isValid = _getParamsAndValidate(reqParam, function(reqParam){
			Hoot.model.REST('saveReviewBookmark', reqParam, function (resp) {   
                
                if(_currentForm) {
                	_currentForm.remove();
                }
            });
		});

		if(!isValid) {
			//iD.ui.Alert('Invalid inputs. Is title valid?','warning');
			alert('Invalid inputs!');
		}
		
	}

	var _getParamsAndValidate = function(reqParam, callback) {
		var isValid = false;

		try
		{
			var title = d3.select('#reviewBookmarkTitle').value();
			var desc = d3.select('#reviewBookmarkDescription').value();
			var note = d3.select('#reviewBookmarkNote').value();

			if(!title || title.length == 0 || !desc || desc.length == 0 || !note || note.length == 0) {
				throw "Invalid values.";
			}

	
			var creatorEmail = d3.select('#reviewBookmarkCreatorEmail').value();
			if(!creatorEmail || creatorEmail.length == 0) {
				var r = confirm("If you continue this bookmark will be published by as anonymous user. "+
                  "Do you want to continue?");
                if (r != true) {
                  return isValid;
                }
                _createReqParams(title, desc, note, reqParam); 
		        if(callback) {
		        	callback(reqParam);
		        }
			} else {
				req = {};
				req.email=creatorEmail;
				Hoot.model.REST('getSaveUser', req, function (resp) {   
                
	                if(resp.error){
						context.hoot().view.utilities.errorlog.reportUIError(resp.error);
						return;
			        }
			        if(resp.user) {
			        	_userInfo = resp.user;
			        }
			        
			        _createReqParams(title, desc, note, reqParam); 
			        if(callback) {
			        	callback(reqParam);
			        	context.hoot().getAllusers();
			        }
	            });
			}
			isValid = true;
		}
		catch (exception)
		{

		}
		return isValid;
	}

	var _createReqParams = function(title, desc, note, reqParam)
	{
		var currentReviewable = context.hoot().control.conflicts.actions.traversereview.getCurrentReviewable();

			
		var detail = {};
		var bookmarkDetail = {};
		bookmarkDetail['title'] = title;
		bookmarkDetail['desc'] = desc;

		var bookmarkNotes = [];
		var bmNote = {};
		bmNote['userId'] = _userInfo.id;
		bmNote['note'] = note;
		bookmarkNotes.push(bmNote);

		detail['bookmarkdetail'] = bookmarkDetail;
		detail['bookmarknotes'] = bookmarkNotes;
		detail['bookmarkreviewitem'] = currentReviewable;

		reqParam['detail'] = detail;
		reqParam['mapId'] = currentReviewable.mapId;
		reqParam['relationId'] = currentReviewable.relationId;
		reqParam['userId'] = _userInfo.id;
	}

	return d3.rebind(_instance, _events, 'on');
}