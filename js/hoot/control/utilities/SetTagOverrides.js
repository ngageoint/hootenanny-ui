Hoot.control.utilities.settagoverrides = function(context) {
    var _events = d3.dispatch('cancelSaveLayer');
    var _instance = {};

    var _isCancel = false;

    var _rowNum = 0;
    var _columns;

    var _table;
    var _modalbg;
    var _form;

    var _submitExp;

    /**
    * @desc Entry point where it creates form.
    * @param trans - Translations list.
    **/
    _instance.setTagOverridesContainer = function() {
        var tagList = [
            {'key':'attribution','value':''},
            {'key':'security:resource_owner','value':''},
            {'key':'security:classification','value':''},
            {'key':'security:dissemination:control:ic','value':''},
            {'key':'security:dissemination:control:non_ic','value':''},
            {'key':'security:releasability','value':''},
            {'key':'source:non_spatial_source:type','value':''},
            {'key':'source:copyright','value':''},
            {'key':'source','value':''}
        ];
        _reset();
        _createContainer(tagList);
    };

    /**
    * @desc Internal form creation.
    * @param trans - Translations list.
    **/
    var _createContainer = function(tagList) {
        _rowNum = 0;

        _columns = [
            {label:'Tag', placeholder: 'Tag', type: 'tagName'},
            {label:'Value', placeholder: 'Leave Blank to Remove Tag on Export', type: 'tagValue'},
            {label:'', placeholder:'',type:'deleteRow',icon:'trash'}
        ];

        _modalbg = _createModalBackground();
        var ingestDiv = _createFormFrame(_modalbg);
        _form = _createForm(ingestDiv);
        _createTableHeader();
        _createTableBody(ingestDiv, tagList);
    };


    /**
    * @desc Creates black background.
    **/
    var _createModalBackground = function() {
        return d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
    };

    /**
    * @desc Creates form frame on top of black background.
    * @param modalbg - back ground div.
    **/
    var _createFormFrame = function (modalbg) {
        return modalbg.append('div')
            .classed('contain col10 pad1 hoot-menu fill-white round modal', true)
            .style({'display':'block','margin-left':'auto','margin-right':'auto','left':'0%'});
    };

    /**
    * @desc Creates form within the frame.
    * @param ingestDiv - ingest div.
    **/
    var _createForm = function (ingestDiv) {

        var frm = ingestDiv.append('form');
        frm.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Set Tag Override Values')
            .append('div')
            .classed('fr _icon x point', true)
            .on('click', function () {
                _modalbg.remove();
            });

        return frm;
    };


    /**
    * @desc Creates table header.
    **/
    var _createTableHeader = function() {
        _table = _form.append('table').attr('id','tagOverrideTable');
        //set column width for last column
        var colgroup = _table.append('colgroup');
        colgroup.append('col').attr('span','2').style('width','100%');
        colgroup.append('col').style('width','30px');

        _table.append('thead').append('tr')
            .selectAll('th')
            .data(_columns).enter()
            .append('th')
            .attr('class',function(d){return d.cl;})
            .classed('pad0y strong fill-light round-top keyline-bottom', true)
            .text(function(d){return d.label;});
    };


    /**
    * @desc Creates table body.
    * @param ingestDiv - ingest form div.
    **/
    var _createTableBody = function(ingestDiv, tagList) {
        _table.append('tbody');
        
        // Add row for each dataset
        var _rowContainer = d3.select('#tagOverrideTable').select('tbody');
        
        _.each(tagList,function(tag){
            _addRow(_rowContainer, tag);
        });

        _isCancel = false;
        _submitExp = ingestDiv.append('div')
            .classed('form-field col12 left ', true);

        _submitExp.append('span')
            .classed('round strong big loud dark center col2 point fr', true).style('margin-left','5px')
            .text('Save Overrides')
            .on('click', _submitClickHandler);

        _submitExp.append('span')
            .classed('round strong big loud dark center col2 point fr', true)
            .style('margin-left','5px')
            .attr('id','btnAddRow')
            .text('Add Row')
            .on('click', function () {
                _addRow(d3.select('#tagOverrideTable').select('tbody'));
            });            
    };


    /**
    * @desc Click handler for request.
    **/
    var _submitClickHandler = function() {
        // If in progress, check to cancel
        _submitTags();
        _modalbg.remove();
    };
        
    /**
    * @desc changes button to close
    **/
    var _closeContainer = function() {
        _submitExp.select('span')
            .text('Close')
            .on('click',function(){
                 _modalbg.remove();
            });
    };

    var _submitTags = function(){
        //Loop through each row and treat as separate function
        var rowArray = d3.select('#tagOverrideTable').selectAll('tr[id^="row-"]')[0];

        _tagList = [];

        _.each(rowArray,function(r){
            var _key = d3.select(r).select('.tagName').value();
            var _value = d3.select(r).select('.tagValue').value();
           _tagList.push({'key':_key,'value':_value});
        });
        context.hoot().control.utilities.exportdataset.setOverrideList(_tagList);
    };

    /**
    * @desc Adds new row of ingest input fields.
    * @param tbl - table div.
    **/
    var _addRow = function(tbl, tag){
        if(_rowNum>10){
            iD.ui.Alert('Please limit multiple dataset import to 10 datasets or less.','warning',new Error().stack);
            return;
        }

        tbl.append('tr').attr('id','row-' + _rowNum).style('border-bottom','1px lightgray solid')
        .selectAll('td')
        .data(function(row, i) {
            // evaluate column objects against the current row
            return _columns.map(function(c) {
                var cell = {};
                d3.keys(c).forEach(function(k) {
                    cell[k] = typeof c[k] === 'function' ? c[k](row,i) : c[k];
                });
                return cell;
            });
        }).enter()
        .append('td')
        .append('div').classed('contain tag-override form-field fill-white small round space-bottom1',true).append('input')
        .attr('class', function(d){return 'reset  tag-override ' + d.type;})
        .attr('row',_rowNum)
        .attr('placeholder',function(d){return d.placeholder;})
        .select(function (a) {
            if(tag !== undefined){
                if (a.type === 'tagName') {
                    d3.select(this).attr('value', tag.key);
                }

                if (a.type === 'tagValue') {
                    d3.select(this).attr('value', tag.value);
                }
            }
            

            if (a.readonly){
                d3.select(this).attr('readonly',true);
            }

            if (a.icon) {
                if(a.type==='deleteRow'){
                    var parentNode = d3.select(this.parentNode);
                    d3.select(this).remove();
                    parentNode.append('span')
                        .classed('point _icon trash pad0x', true)
                        .attr('id', 'deleterow-'+ _rowNum)
                        .on('click',function(){
                            var rowid = this.id.replace('delete','');
                            d3.select('#'+rowid).remove();
                        });
                }
            }

            if(a.combobox){
                if(a.combobox.command) {
                    a.combobox.command.call(this, a);
                }
            }

        });

        _rowNum++;
    };

    /**
    * @desc Reset global variables.
    **/
    var _reset = function() {
        _trans = null;

        _isCancel = false;

        _rowNum = 0;
        _columns = null;

        _table = null;
        _modalbg = null;
        _form = null;

        _submitExp = null;
    };

    return d3.rebind(_instance, _events, 'on');
};
