Hoot.model.import = function (context)
{
	var import_layer = {};
	var importCallback;
	var jobIdsArr;
    var mapIdsArr;

    import_layer.updateTrees = function()
    {
    	//This function updates the SVG folder/dataset collapsable tree
    	_.each(d3.select("#sidebar2").node().childNodes,function(f){
    		if(f.classList.contains('hootImport')){
    			var _svg = d3.select(f).select('svg');
    			if(!_svg.empty()){
    				var container = _svg.node().parentNode;
    				_svg.remove();
    				hoot.control.utilities.folder.createFolderTree(d3.select(container));
    			}
    		}
    	});
    	
    	var datasettable = d3.select('#datasettable');
        context.hoot().view.utilities.dataset.populateDatasetsSVG(datasettable);
    }
    
    import_layer.importData = function (container, callback) {

		_initVariables();
    	importCallback = callback;

        var imprtProg = d3.select('#importprogress'); 
       var imprtProgText = d3.select('#importprogresstext');

        jobIdsArr = [];
        mapIdsArr = [];
        var transType = container.select('.reset.Schema').value();

        var comboData = container.select('.reset.Schema').datum();
        var transName = transType;
        var oTrans = null;
        for(i=0; i<comboData.combobox.length; i++){
            var o = comboData.combobox[i];
            if(o.DESCRIPTION == transType){
                transName = o.NAME;
                oTrans = o;
                break;
            }

        }

        // Checks to see if it is default translation and if so use the path specified
        var transcriptName = iD.data.hootConfig.defaultScript;
        var isDefTrans = false;
        if(oTrans && oTrans.DEFAULT == true) {
            if(oTrans.PATH && oTrans.PATH.length > 0){
                transcriptName = oTrans.PATH;
                isDefTrans = true;
            }
        }

        if(isDefTrans == false && transName != null && transName != ''){
            transcriptName = 'customscript/' + transName + '.js';
        }

        var selType = container.select('.reset.importImportType').value();

        var comboData = container.select('.reset.importImportType').datum();
        var typeName = "";
        for(i=0; i<comboData.combobox2.length; i++){
            var o = comboData.combobox2[i];
            if(o.title == selType){
                typeName = o.value;
                break;
            }

        }
        
        //create proper path name, replacing any '/' with '|'
        var re = new RegExp('/','g')
        var pathname = container.select('.reset.PathName').value();
        pathname = pathname.replace(re,'|');
        if(pathname !='' && pathname[pathname.length-1]!='|'){pathname += '|';}

        //determine if a new folder is being added
        var newfoldername = container.select('.reset.NewFolderName').value();
        newfoldername = newfoldername.replace(re,'|');
        if(newfoldername !='' && newfoldername[newfoldername.length-1]!='|'){newfoldername += '|';}
        if(newfoldername!=''){pathname += newfoldername;}
        
        var data = {};
        data.INPUT_TYPE = typeName;
        data.TRANSLATION = transcriptName;//(transType === 'LTDS 4.0' || !transType) ? 'NFDD.js' : transType + '.js';
        data.INPUT_NAME = pathname.concat(container.select('.reset.LayerName').value());//container.select('.reset.LayerName').value();
        data.formData = import_layer.getFormData(/*document.getElementById('ingestfileuploader').files*/);

        Hoot.model.REST('Upload', data, _importResultHandler);
    };

    import_layer.getFormData = function()
    {
        var formData = new FormData();
        var files = document.getElementById('ingestfileuploader').files;

        _.each(files, function(d,l){
            formData.append('eltuploadfile' + l, d);
        });
        return formData;
    };

    var _importResultHandler = function (resp) {
        if (!resp || resp.responseText.length === 0 || resp.response==='[]') {
            if(importCallback){
                var status = {};
                status.info = 'failed';
                importCallback(status);
             }

            return;
        }



        var imprtProg = d3.select('#importprogress'); 
        var imprtProgText = d3.select('#importprogresstext');

        var jobStatus = resp.responseText;
        var jobStatusArr = JSON.parse(jobStatus);
        for (var ii = 0; ii < jobStatusArr.length; ii++) {
            var o = jobStatusArr[ii];
            jobIdsArr.push(o.jobid);
            mapIdsArr.push(o.output);
        }

        if(importCallback){
            var status = {};
            status.info = 'uploaded';
            status.jobids = jobIdsArr;
            status.mapids = mapIdsArr;
            importCallback(status);
        }

        var stat = function (curJobId) {
            Hoot.model.REST('jobStatusLegacy', curJobId, function (a) {
                if (a.status !== 'running' || !a.status) {
                    if (_.contains(jobIdsArr, a.jobId)) {
                        jobIdsArr = _.without(jobIdsArr, a.jobId);
                    }
                    if (jobIdsArr.length === 0) {
                        clearInterval(uploadJobStatusTimer);
                    }

                    Hoot.model.REST.WarningHandler(a);
                    uploadJobStatusStopTimer(a);
                }
                var truncatedLastText = a.lasttext;
                    if(truncatedLastText){
                        var truncatelen = 70;
                        if(truncatedLastText.length > truncatelen){
                            truncatedLastText = truncatedLastText.substring(0, truncatelen) + " ...";
                        }
                        
                        imprtProgText.text(truncatedLastText);
                    }
                    
                    imprtProg.value(a.percentcomplete);
            });
        };
        var status = function () {
            for (var j = 0; j < jobIdsArr.length; j++) {
                var curJobId = jobIdsArr[j];
                stat(curJobId);
            }
        };
        var uploadJobStatusTimer = setInterval(function () {
            status();
        }, iD.data.hootConfig.JobStatusQueryInterval);
        var uploadJobStatusStopTimer = function (uploadJobStat) {
            context.hoot().model.layers.refresh(
            	function() {
            		_uploadHandler(uploadJobStat);
            	}            	
            );
        };
    }

    var _uploadHandler = function (uploadJobStat) 
    {
    	context.hoot().model.import.updateTrees();
        /*var datasettable = d3.select('#datasettable');
        context.hoot().view.utilities.dataset.populateDatasetsSVG(datasettable);*/
        if(importCallback){
            var status = {};
            status.info = uploadJobStat.status;
            importCallback(status);
            }

    }

    var _initVariables = function()
    {
	    importCallback = null;
		jobIdsArr = null;
	    mapIdsArr = null;
    }
    return import_layer;
};