Hoot.control.conflicts.actions.sharereview = function (context)
{
	var _events = d3.dispatch();
	var _instance = {};
	var _currentForm;

	_instance.publish = function(){
		_instance.createDialog();
	}

	_instance.createDialog = function() {

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
		var isValid = _getParamsAndValidate(reqParam);

		if(isValid) {
			Hoot.model.REST('saveReviewBookmark', reqParam, function (resp) {   
                
                if(_currentForm) {
                	_currentForm.remove();
                }
            });
		} else {
			//iD.ui.Alert('Invalid inputs. Is title valid?','warning');
			alert('Invalid inputs. Is title valid?');
		}
		
	}

	var _getParamsAndValidate = function(reqParam) {
		var isValid = false;

		try
		{
			var title = d3.select('#reviewBookmarkTitle').value();
			var desc = d3.select('#reviewBookmarkDescription').value();
			var note = d3.select('#reviewBookmarkNote').value();

			if(!title || title.length == 0) {
				throw "Invalid values.";
			}

			var currentReviewable = context.hoot().control.conflicts.actions.traversereview.getCurrentReviewable();

			
			var detail = {};
			var bookmarkDetail = {};
			bookmarkDetail['title'] = title;
			bookmarkDetail['desc'] = desc;

			var bookmarkNotes = [];
			var bmNote = {};
			bmNote['userId'] = -1;
			bmNote['note'] = note;
			bookmarkNotes.push(bmNote);

			detail['bookmarkdetail'] = bookmarkDetail;
			detail['bookmarknotes'] = bookmarkNotes;
			detail['bookmarkreviewitem'] = currentReviewable;

			reqParam['detail'] = detail;
			reqParam['mapId'] = currentReviewable.mapId;
			reqParam['relationId'] = currentReviewable.relationId;
			reqParam['userId'] = -1;
			isValid = true;
		}
		catch (exception)
		{

		}
		return isValid;
	}

	return d3.rebind(_instance, _events, 'on');
}