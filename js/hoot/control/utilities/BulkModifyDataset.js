/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.bulkmodifydataset for moving existing datasets to a folder.
//
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      17 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.bulkmodifydataset = function(context) {
    var _events = d3.dispatch();
    var _instance = {};

    var _datasets;
    var _container;


    /**
    * @desc Entry point where it creates form.
    * @param datasets - Target datasets meta data.
    **/
    _instance.bulkModifyContainer = function(datasets) {
        _createContainer(datasets);
    };

    /**
    * @desc Internal form creation.
    * @param datasets - Target datasets meta data.
    **/
    var _createContainer = function(datasets) {
        _datasets = datasets;
        hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
        var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
        var folderId = 0;
        var placeholder = 'root';

        var d_form = [{
            label: 'Path',
            id: 'bulkModifyPathname',
            placeholder:placeholder,
            combobox: {'data':folderList, 'command': _populatePaths },
            inputtype:'combobox'
        },
        {
            label: 'New Folder Name (leave blank otherwise)',
            id: 'bulkModifyNewfoldername',
            placeholder:''
        }];


        var d_btn = [
                    {
                        text: 'Update',
                        location: 'right',
                        id: 'bulkModifyDatasetBtnContainer',
                        onclick: _submitClickHandler
                    }
                ];

        var meta = {};
        meta.title = 'Move Datasets';
        meta.form = d_form;
        meta.button = d_btn;

        _container = context.hoot().ui.formfactory.create('body', meta);
    }

    /**
    * @desc Populates folders list.
    * @param field - fieldset meta data.
    **/
    var _populatePaths = function(field) {
        var comboPathName = d3.combobox()
            .data(_.map(field.combobox.data, function (n) {
                return {
                    value: n.folderPath,
                    title: n.folderPath
                };
            }));

        comboPathName.data().sort(function(a,b){
              var textA = a.value.toUpperCase();
              var textB=b.value.toUpperCase();
              return(textA<textB)?-1 : (textA>textB)?1:0;
          });

        comboPathName.data().unshift({value:'root',title:0});

        d3.select(this)
            .style('width', '100%')
            .call(comboPathName);

        d3.select(this).attr('readonly',true);
    }


    /**
    * @desc Move request click handler.
    **/
    var _submitClickHandler = function() {
        //TODO: ADD WARNING MESSAGE, REQUIRE CONFIRMATION

        var pathname = _container.select('#bulkModifyPathname').value();
        if(pathname==''){pathname=_container.select('#bulkModifyPathname').attr('placeholder');}
        if(pathname=='root'){pathname='';}
        var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;

        //Add folder if necessary
        var newfoldername = _container.select('#bulkModifyNewfoldername').value();
            resp = context.hoot().checkForUnallowedChar(newfoldername);
        if(resp != true){
            iD.ui.Alert(resp,'warning',new Error().stack);
             return;
        }

        resp = hoot.model.folders.duplicateFolderCheck({name:newfoldername,parentId:pathId});
        if(resp != true){
            iD.ui.Alert(resp,'warning',new Error().stack);
            return;
        }

        var folderData = {};
         folderData.folderName = newfoldername;
         folderData.parentId = pathId;
         hoot.model.folders.addFolder(folderData,function(a){
             //refresh when done
             context.hoot().model.layers.refresh(function(){

                 //Now that our folder has been created, loop through datasets and update the link
                 _.each(_datasets,function(dataset){
                     var lyrId = parseInt(dataset),
                     outputname = hoot.model.layers.getNameBymapId(lyrId);
                     if(outputname==null){return;}

                     var link = {};
                     link.folderId = a;
                     link.mapid = lyrId;
                     link.updateType="update";
                     hoot.model.folders.updateLink(link);
                     link = {};
                 });

                 _container.remove();

             });
         });
    }

    return d3.rebind(_instance, _events, 'on');

}