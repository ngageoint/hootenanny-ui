/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.ui.hootformreviewnote is a specialized hoot form for bookmark note.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      02 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


Hoot.ui.hootformreviewnote = function (context)
{
    var _events = d3.dispatch();
    var _instance = {};
    var _rawData;
    var _parent = context.hoot().view.utilities.reviewbookmarknotes;
    var _currentUserForm; // user input form

    /**
    * @desc Create basic hoot form
    * @param containerId - id of container div
    * @param formMetaData - meta data object that describes the form
    * @return returns created form.
    **/
    _instance.createForm = function(containerId, formMetaData) {
        var form;
        // try{
            _rawData = formMetaData.rawData;
            var btnMeta = formMetaData.button;
            var formMeta = formMetaData.form;
            var formTitle = formMetaData.title;

            if(!formMeta) {
                throw new Error('Failed to create UI. Invalid form meta data.');
            }

            if(!formTitle){
                formTitle = 'Hootenanny Form';
            }

            var container = d3.select('#' + containerId);
            var formDiv = _createFormDiv(container);
            form = _createForm(container, formDiv, formTitle, formMetaData.modifyHandler, formMetaData.isNew);
            _createFieldSet(form, formMeta);
            _createButtons(btnMeta, formDiv);

        // } catch (error) {
        //     console.error(error);
        // }

        return form;
    };


    /**
    * @desc Create form container div
    * @param container - id of container div
    * @return returns created div.
    **/
    var _createFormDiv = function(container) {
        var bufferForDiv = container.append('div')
                .classed('pad1y col12', true);
        return bufferForDiv.append('div')
                .classed('fill-white round keyline-all col12', true);
    };

    /**
    * @desc Create form shell
    * @param container - id of container div
    * @param formDiv - id of container div
    * @param formTitle - dialog title
    * @param modifyHandler - handler function for when user presses modify button
    * @param isNew - [true | false] true if the form is empty new note form
    * @return returns created form.
    **/
    var _createForm = function(container, formDiv, formTitle, modifyHandler, isNew) {
        var form = formDiv.append('form');
        var hdBar = form.classed('round importableLayer', true)
                .append('div')
                .classed('big pad0y fill-darken1', true);

        var labelId = 'NEW';
        if(_rawData) {
            labelId = _rawData.id;
        }
        var hdLabel = hdBar.append('h4')
                .attr('id', 'bmkNoteFormHdLabel' + labelId)
                .text(formTitle);

        if(!isNew) {
            hdLabel
                .append('div').classed('fr', true)
                .call(iD.svg.Icon('#icon-plus'))
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();

                    formDiv.select('#bmkNoteText' + _rawData.id).attr('readonly', null);

                    var d_btn = [
                        {
                          text: 'Save',
                          location: 'right',
                          onclick: function(){
                            var newNote = formDiv.select('#bmkNoteText' + _rawData.id).value();
                            _rawData.note = newNote;
                            modifyHandler(_rawData);
                          }
                        },
                        {
                          text: 'Cancel',
                          location: 'right',
                          onclick: function(){
                            d3.event.stopPropagation();
                            d3.event.preventDefault();
                            formDiv.select('#bmkNoteText' + _rawData.id).attr('readonly', 'readonly');
                            d3.select('#reviewBookmarkNotesBtnContainer').remove();
                            d3.select('#bmkNoteFormUser' + _rawData.id).remove();
                            d3.select(this).classed('buttonsAdded', false);
                            d3.select('div.buttonsAdded').classed('buttonsAdded', false);
                          }
                        }
                    ];

                    if (!d3.select(this).classed('buttonsAdded')){
                        d3.select('#bmkNoteFormHdLabel' + _rawData.id)
                            .append('div')
                            .attr('id', 'bmkNoteFormUser' + _rawData.id)
                            .classed('fr', true)
                            .call(iD.svg.Icon('#icon-avatar'))
                            .on('click', _bmkUserClickHanlder);

                        _createButtons(d_btn, formDiv);

                        d3.select(this).classed('buttonsAdded', true);

                    } else {
                        return;
                    }

                });
        } else {
            d3.select('#bmkNoteFormHdLabel' + 'NEW')
            .append('div')
            .attr('id', 'bmkNoteFormUser' + 'NEW')
            .classed('fr', true)
            .call(iD.svg.Icon('#icon-avatar'))
            .on('click', _bmkUserClickHanlder);
        }


        return form;
    };

    /**
    * @desc Create user form when avatar icon is clicked
    **/
    var _bmkUserClickHanlder = function() {

        var userEmail = null;
        var userInfo = _parent.getUser();
        if(userInfo.id > -1) {
            userEmail = userInfo.email;
        }
        var d_form = [
            {
                label: 'Creator Email',
                id: 'rbmkNoteCreatorEmail',
                placeholder: '',
                inputtype:'text',
                text: userEmail
            }];

        var d_btn = [
                        {
                            text: 'Set',
                            location: 'right',
                            onclick: _storeUser
                        }
                    ];

        var meta = {};
        meta.title = 'Set User For Session';
        meta.form = d_form;
        meta.button = d_btn;

        _currentUserForm = context.hoot().ui.formfactory.create('body', meta);

    };

    /**
    * @desc Saves get/saved user to be reused during current session. It also refreshes global users lit.
    **/
    var _storeUser = function() {

        var creatorEmail = d3.select('#rbmkNoteCreatorEmail').value();
        if(!creatorEmail || creatorEmail.length === 0){
            alert('Creator Email field is empty and it will not be set.');
            if(_currentUserForm) {
                _currentUserForm.remove();
            }
        }
        else
        {
            var req = {};
            req.email=creatorEmail;
            Hoot.model.REST('getSaveUser', req, function (resp) {

                if(resp.error){
                    context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                    return;
                }
                if(resp.user) {
                    _parent.setUser(resp.user);
                    // sets user back to share dialog. (We need to refactor this)
                    context.hoot().control.conflicts.actions.sharereview.setUserInfo(resp.user);
                }
                // relaod global users list
                context.hoot().getAllusers();
                if(_currentUserForm) {
                    _currentUserForm.remove();
                }

            });
        }

    };

    /**
    * @desc Create textarea for note.
    * @param form - container form.
    * @param formMeta - fields meta data
    * @return returns created fields.
    **/
    var _createFieldSet = function(form, formMeta) {
        var fieldset = form.append('fieldset')
                .selectAll('.form-field')
                .data(formMeta);


        fieldset.enter()
                .append('div')

                .select(function(a){


                    var field = d3.select(this);

                    // add header and label
                    field
                    .classed('form-field fill-white small space-bottom1', true)
                    .style('height','120px');


                    if(a.inputtype === 'textarea') {

                        var fieldDiv = field
                        .append('div')
                        .classed('contain', true);

                        var inputField = fieldDiv
                        .append('textarea')
                        .attr('placeholder', function (field) {
                            return field.placeholder;
                        })
                        .classed('col12 overflow', true)
                        .style('display','block')
                        .style('height','120px')
                        .text(a.inputText);

                        if(a.readonly === true){
                            inputField.attr('readonly','readonly');
                        }
                        if(a.id) {
                            inputField.attr('id', a.id);
                        }
                    }


                });


        return fieldset;
    };

    /**
    * @desc Create form buttons
    * @param btnMeta - buttons meta data
    * @param formDiv - id of container div
    * @return returns created fields.
    **/
    var _createButtons = function(btnMeta, formDiv) {
        if(btnMeta){
            var btnContainer = formDiv.append('div')
                .attr('id', 'reviewBookmarkNotesBtnContainer')
                .classed('form-field col12 pad1y pad1x ', true);
            _.each(btnMeta, function(m){


                var onClick = function(){};
                if(m.onclick){
                    onClick = m.onclick;
                }

                 btnContainer.append('span')
                .classed('round strong big loud dark center col2 margin1 point', true)
                .classed('inline row1 fr pad1y', true)
                .text(m.text)
                .on('click', onClick);


            });
        }

    };


    return d3.rebind(_instance, _events, 'on');
};