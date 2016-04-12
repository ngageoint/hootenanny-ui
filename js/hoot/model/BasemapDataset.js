/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.model.basemapdataset provides REST connection to Hoot service for uploading new basemap.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      18 Dec. 2015
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.model.basemapdataset = function(context)
{
    var model_basemapdataset = {};


   model_basemapdataset.publishBasemap = function (container,callback) {

         function getFormData(){
                var formData = new FormData();
                var files = document.getElementById('basemapfileuploader').files;

                _.each(files, function(d,l){
                    formData.append('basemapuploadfile' + l, d);
                });
                return formData;
         }


       var jobIdsArr = [];


       var data = {};
       data.INPUT_NAME = container.select('.reset.BasemapName').value();
       data.formData = getFormData(document.getElementById('basemapfileuploader').files);

       Hoot.model.REST('basemapUpload', data, function (resp) {
           if (resp.responseText.length === 0 || resp.response==='[]') {
               if(callback){callback(false);}
               iD.ui.Alert('Failed publish basemap.','warning',new Error().stack);
               return;
           }



           var jobStatus = resp.responseText;
           var jobStatusArr = JSON.parse(jobStatus);
           if(callback){
               callback(jobStatusArr);
           }


       });
   };



    return model_basemapdataset;
}