/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.utilities.translation provides new translation creation dialog.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.utilities.translation = function(context) {
    var hoot_control_utilities_translation = {};


    hoot_control_utilities_translation.newTranslationPopup = function (transText) {
        var transTemplateText;

        if(transText){transTemplateText=transText;}

        var modalbg = d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
        var ingestDiv = modalbg.append('div')
            .classed('contain col6 pad1 fill-white round modal', true);
        var _form = ingestDiv.append('form');
        _form.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Create New Translation')
            .append('div')
            .classed('fr _icon x point', true)
            .on('click', function () {
                modalbg.remove();
            });
        var name = ingestDiv.append('div');
        name.append('label')
            .html('<strong>Name:</strong> ');
        var nameVal = name.append('input')
            .attr('type', 'text')
            .attr('id','translationName')
            .classed('translationName',true);
        var desc = ingestDiv.append('div');
        desc.append('label')
            .html('<strong>Description:</strong> ');
        var descVal = desc.append('input')
            .attr('type', 'text')
            .classed('translationDescription',true);
        ingestDiv.append('span')
            .text('Paste New Translation in Box (or drag .js file into text area)');
        var transTemplate = ingestDiv.append('textarea')
            .classed('row5', true)
            .classed('translationText',true)
            .attr('id','transDropzone', true)
            .text(transTemplateText)
            .on('drop', function(){
                handleFileDrop();
            });

        var handleFileDrop = function(evt){
            event.stopPropagation();
            event.preventDefault();

            var files = event.dataTransfer.files; // FileList object.
            var file = files[0];
            if(file.type !== 'text/javascript'){
                iD.ui.Alert('Only javascript (.js) files can be copied here).','notice','');
                return;
            } else {
                document.getElementById('translationName').value = file.name.replace('.js','');
            }

            var reader = new FileReader();  
            reader.onload = function(event) {            
                 document.getElementById('transDropzone').value = event.target.result;
            };   
            reader.readAsText(files[0],'UTF-8');
          };

        var savetransNew = ingestDiv.append('div')
            .classed('hidden form-field col12 center', true);
        savetransNew.append('input')
            .attr('type', 'submit')
            .attr('value', 'Save Edits')
            .classed('round strong big pad1y loud dark center pad2x translationSave', true)
            .on('click', function () {
                var data = {};
                data.NAME = nameVal.value();
                data.DESCRIPTION = descVal.value();
                data.data = transTemplate.value();
                postTranslation(data);
            });


        function validateFields(){
            var name = nameVal.value();
            var desc = descVal.value();
            var template = transTemplate.value();
            if(name && desc && template){
                savetransNew.classed('hidden', false);
            } else {
                savetransNew.classed('hidden', true);
            }

        }

        transTemplate.on('keyup.change', function () { validateFields(); });

        nameVal.on('keyup', function () { validateFields(); });

        descVal.on('keyup', function () { validateFields(); });

        transTemplate.on('paste',function(){
            setTimeout(function(){validateFields();}, 0);
        });

        nameVal.on('paste',function(){
            setTimeout(function(){validateFields();}, 0);
        });

        descVal.on('paste',function(){
            setTimeout(function(){validateFields();}, 0);
        });

        function postTranslation(e) {
            Hoot.model.REST('postTranslation', e, function (resp) {
                if(resp.error){
                    context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                    return;
                }
                modalbg.remove();
                setTimeout(function () {
                    context.hoot().view.utilities.translation.populateTranslations();
                }, 1000);
            });
        }
    };



    hoot_control_utilities_translation.renderTranslationDlg = function(e, d){

            if(d.error){
                context.hoot().view.utilities.errorlog.reportUIError(d.error);
                return;
            }
            var modalbg = d3.select('body')
                .append('div')
                .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
            var ingestDiv = modalbg.append('div')
                .classed('contain col6 pad1 fill-white round modal', true);
            var _form = ingestDiv.append('form');
            _form.classed('round space-bottom1 importableLayer', true)
                .append('div')
                .classed('big pad1y keyline-bottom space-bottom2', true)
                .append('h4')
                .text(e.NAME)
                .append('div')
                .classed('fr _icon x point', true)
                .on('click', function () {
                    modalbg.classed('hidden', true);
                });

          /*  var name = ingestDiv.append('div');
            name.append('label')
                .html('<strong>Name:</strong> ');
            var nameVal = name.append('input')
                .attr('type', 'text');*/
            var desc = ingestDiv.append('div');
            desc.append('label')
                .html('<strong>Description:</strong> ');
            var descVal = desc.append('input')
                .attr('type', 'text')
                .classed('translationDescription',true);
            descVal.value(e.DESCRIPTION);



            descVal.on('keydown', function () {
                savetransEdit.classed('hidden', false);
            });

            ingestDiv.append('span')
                .text('Click in Box to Edit Translation');
            var textArea = ingestDiv.append('textarea')
                .classed('row7', true)
                .classed('translationText',true)
                .text(d);
            var savetransEdit = ingestDiv.append('div')
                .classed('hidden form-field col12 center', true);
            savetransEdit.append('input')
                .attr('type', 'submit')
                .attr('value', 'Save Edits')
                .classed('round strong big pad1y loud dark center pad2x', true)
                .on('click', function () {
                    var data = {};
                    data.NAME = e.NAME;
                    data.DESCRIPTION = descVal.value();
                    data.data = textArea.value();
                    postTranslation(data);
                });


            textArea.on('keydown', function () {
                savetransEdit.classed('hidden', false);
            });

            if(e.DEFAULT === true){
                descVal.attr('disabled', true);
                textArea.attr('disabled', true);
            }

            function postTranslation(e) {
                Hoot.model.REST('postTranslation', e, function (resp) {
                    if(resp.error){
                        context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                        return;
                    }
                    modalbg.remove();
                    setTimeout(function () {
                        context.hoot().view.utilities.translation.populateTranslations();
                    }, 1000);
                });
            }

    };

    hoot_control_utilities_translation.translationPopup = function(e) {
        if(e.DEFAULT === true){
            Hoot.model.REST('getDefaultTranslation', e.PATH, function (d) {
                hoot_control_utilities_translation.renderTranslationDlg(e, d);

            });
        } else {
            Hoot.model.REST('getTranslation', e.NAME, function (d) {
                hoot_control_utilities_translation.renderTranslationDlg(e, d);

            });
        }

    };

    hoot_control_utilities_translation.exportTranslation = function(e) {
        if(e.DEFAULT === true){
            Hoot.model.REST('getDefaultTranslation', e.PATH, function (transText) {
                hoot_control_utilities_translation.prepareTranslation(transText, e.NAME);
            });
        } else {
            Hoot.model.REST('getTranslation', e.NAME, function (transText) {
                hoot_control_utilities_translation.prepareTranslation(transText, e.NAME);
            });
        }
    };

    hoot_control_utilities_translation.prepareTranslation = function(translationText, fileName) {
        var transBlob = new Blob([translationText], {type:'text/javascript'});
        window.saveAs(transBlob, fileName + '.js');
    };


    return hoot_control_utilities_translation;
};