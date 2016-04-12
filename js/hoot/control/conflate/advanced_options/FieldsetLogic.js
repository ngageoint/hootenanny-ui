////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflate.advancedoptions.fieldsetlogic provides logics to set field values using rules.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      7 Jan. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Hoot.control.conflate.advancedoptions.fieldsetlogic = function () {
    var _events = d3.dispatch();
    var _instance = {};

    /**
    * @desc Toggles field and applies rules to dependent fields
    * @param event - event
    **/
    _instance.toggleFields = function(event) {
        var evt = event||window.event;
         var target = evt.target||evt.srcElement;
         var setVal = null;
         if(target.type=='checkbox'){
             setVal = d3.select('#'+target.id).property('checked');
         } else {
             setVal = d3.select('#'+target.id).value();
         }

         if(setVal != null){
             if(d3.selectAll('#tr_' + target.id).selectAll('td:nth-child(2)').length){
                 d3.selectAll('#tr_' + target.id).selectAll('td:nth-child(2)').text(setVal);

                 //Special exceptions
                 if(target.id.indexOf('enable')>-1){
                    //Need to take care of everything in group that is on/off when enabled/disabled
                     var arrInputs = d3.select(d3.select(target).node().parentNode.parentNode.parentNode.parentNode).selectAll('input');


                     arrInputs.each(function(){
                         if(setVal)
                         {
                            var rowVal = d3.select(this).value();
                            if(rowVal=='on'){rowVal='true'} else if (rowVal=='off'){rowVal='false'}
                            if(rowVal==''){rowVal=d3.select('#'+this.id).attr('placeholder');}
                            d3.selectAll('#tr_' + this.id).selectAll('td:nth-child(2)').text(rowVal);
                         } else {
                             d3.selectAll('#tr_' + this.id).selectAll('td:nth-child(2)').text('Disabled');
                         }
                     });
                 }


                 if(d3.select(target).on('change') && target.classList.contains('list')){
                     var subitem = d3.select(target).on('change').toString();
                     _.each(_.uniq(subitem.match(/#\w+/g)),function(uniqueItem){
                         if(!d3.select(uniqueItem).empty()){
                             // get current value and change
                             var subVal =  d3.select(uniqueItem).value();
                             if(subVal == ''){subVal = d3.select(uniqueItem).property('checked');}
                             d3.selectAll('#tr_' + uniqueItem.substr(1)).selectAll('td:nth-child(2)').text(subVal);
                         }
                     });
                 }
             }
         }

    }


    /**
    * @desc Populates fields with the values from rule
    * @param s - target element
    **/
    _instance.populateFields = function(s){
        var styles = 'form-field fill-white small keyline-all round space-bottom1';
        if(s.dependency){
            styles += ' hidden';
        }
        if(s.required){
            if(s.required=='true'){
                styles += ' hidden';
            }
        }

        d3.select(this).classed(styles, true)
        .attr('id', s.type + '_container')
        .append('label')
        .attr('id',s.id+'_label')
        .classed('pad1x pad0y strong fill-light round-top keyline-bottom', true)
        .text(function (d) {
            return d.label;
        })
        .on('click', function () {
            var grp = d3.select(this).node().nextSibling;
            if(grp.classList.length==0){
                d3.select(grp).classed('custom-collapse',true)
            } else {
                d3.select(grp).classed('custom-collapse',false)
            }
        });

        d3.select(this).append('div').attr('id',s.id+'_group').classed('custom-collapse',true);
        var parent = d3.select('#'+s.id+'_group');
        var enableInputs = false;
        if(s.children[0].label=='Enabled'){
            enableInputs = !(s.children[0].placeholder == 'true');
        }

        //now loop through children
        _.each(s.children, function(c){
            var styles = 'form-field fill-white small';
            if(c.dependency){
                styles += ' hidden';
            }
            if(c.required){
                if(c.required=='true'){
                    styles += ' hidden';
                }
            }

            var child = parent.append('div')
                .classed(styles,true)
                .attr('id',c.type + '_container');

            // TODO: Need to clean this up
            if(c.multilist){
                _populateMultiListFields(c, child);
            } else if(c.type=='checkbox' || c.type=='checkplus'){
                 _populateCheckFields(c, child);
            } else {
                _populateDefaultFields(c, child);
            }
        });

        parent.selectAll('input:not([id*=enable])').property('disabled',enableInputs);
    }


    /**
    * @desc Populates multilist fields with rules
    * @param c - target element
    * @param child - child elements
    **/
    var _populateMultiListFields = function(c, child) {
        child.append('label').classed('pad1x fill-light round-top', true).text(c.label).property('title',c.description);

        var options = '';
        _.each(c.multilist, function(item){
            options += '<option value='' + item.hoot_val + ''>' + item.name + '</option>';
        })
        child.append('div')
            .classed('contain', true)
            .style('width', '100%')
            .html('<select multiple style='width:100%;height:80px' id='' + 'ml' + c.type + ''>' + options + '</select>');

    }

    var _populateCheckFields = function(c, child) {
        child.append('div')
        .classed('contain', true)
        .html(function(){
            var retval = '<label class='pad1x' style='opacity: 1;' title='' + c.description + ''>';
            retval += '<input type='checkbox' class='reset' id='' + c.id + '' ';
            retval += 'style='opacity: 1;'';
            if(c.placeholder){if(c.placeholder=='true'){retval += ' checked ';}}
            retval += '>' + c.label+'</label>';
            return retval;
        });

        var currentDiv = d3.select('#'+c.id);
        if(c.onchange){
            var fn = new Function(c.onchange);
            currentDiv.on('change',fn);
        }

        if(c.type=='checkplus'){
            var parentDiv = d3.select(currentDiv.node().parentNode.parentNode);
            _.each(c.subchecks,function(subcheck){
                if(subcheck.type=='checkbox'){
                    parentDiv.append('div').classed('contain',true)
                    .html(function(){
                        var retval = '<label class='pad1x ' + c.id + '_child' style='opacity: 1;' title='' + c.description + ''>';
                        retval += '<input type='checkbox' class='reset' id='' + subcheck.id + '' ';
                        retval += 'style='opacity: 1;'';
                        if(subcheck.placeholder){if(subcheck.placeholder=='true'){retval += ' checked ';}}
                        retval += '>' + subcheck.label+'</label>';
                        return retval;
                    });
                } else {
                    var newDiv = parentDiv.append('div').classed('contain ' + c.id + '_child',true);
                    if(subcheck.required){
                        if(subcheck.required=='true'){
                            newDiv.classed('hidden',true);
                        }
                    }
                    newDiv.append('label').classed('pad1x', true).style('display','inline-block').text(subcheck.label).property('title',subcheck.description);
                    newDiv.append('div').classed('contain',true).style('display','inline-block').append('input').attr('type','text').attr('placeholder',subcheck.placeholder).attr('class','reset ' + subcheck.type).attr('id',subcheck.id);
                }
            });
        }
    }

    /**
    * @desc Populates default fields with rules
    * @param c - target element
    * @param child - child elements
    **/
    var _populateDefaultFields = function(c, child){
        child.append('label').classed('pad1x', true).style('display','inline-block').text(c.label).property('title',c.description);

        child.append('div')
            .classed('contain', true)
            .style('display','inline-block')
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', function () {
                return c.placeholder;
            })
            .attr('class', function () {
                return 'reset ' + c.type;
            })
            .attr('id', function(){
                return c.id;
            })
            .select(function(){
                _populateChildren.call(this, c);
            });

        if(c.minvalue){
            c.minvalue.length>0? d3.select('#'+c.id).attr('min',c.minvalue):d3.select('#'+c.id).attr('min','na');
        }
        if(c.maxvalue){
            c.maxvalue.length>0? d3.select('#'+c.id).attr('max',c.maxvalue):d3.select('#'+c.id).attr('max','na');
        }
    }

    /**
    * @desc Populates children fields with rules
    * @param c - target element
    * @param child - child elements
    **/
    var _populateChildren = function (c) {
        if (c.combobox) {
            d3.select('#'+c.id).attr('readonly',true);
            var combo = d3.combobox()
                .data(_.map(c.combobox, function (n) {
                    return {
                        value: n.name,
                        title: n.name,
                        id:n.id
                    };
                }));
            var comboEng = d3.select(this);
            comboEng.style('width', '100%')
                .call(combo);

            //loop through each combobox member to see if it has children...
            var parentDiv = d3.select(d3.select('#'+c.id).node().parentNode);
            _.each(c.combobox,function(subcombo){
                if(subcombo.members){
                    _populatRoadEnginesGroup(c, parentDiv, subcombo);
                }
            });
        }

        if(c.onchange){
            var fn = new Function(c.onchange);
            d3.select(this).on('change',fn);
        }

        if(c.dependency){
                child.classed('hidden', true);
                var controlField = d3.select('#ml' + c.dependency.fieldname);
                controlField.on('change', function(){
                    _onChangeMultiList(d3.select(this));
                })
            }
    }


    /**
    * @desc Populates Road Engines Group fields with rules
    * @param c - target element
    * @param child - child elements
    **/
    var _populatRoadEnginesGroup = function(c, parentDiv, subcombo) {
        var newDiv = parentDiv.append('div').classed('contain hoot_road_opt_engine_group ' + subcombo.name + '_engine_group',true);
        if(subcombo.name!=c.placeholder){newDiv.style('display','none');}
        _.each(subcombo.members,function(subopt){
            if(subopt.type=='checkbox'){
                newDiv.append('div').classed('contain',true)
                .html(function(){
                    var retval = '<label class='pad1x ' + c.id + '_' + subcombo.name + '_child' style='opacity: 1;' title='' + subopt.description + ''>';
                    retval += '<input type='checkbox' class='reset' id='' + subopt.id + '' ';
                    retval += 'style='opacity: 1;'';
                    if(subopt.placeholder){if(subopt.placeholder=='true'){retval += ' checked ';}}
                    retval += '>' + subopt.label+'</label>';
                    return retval;
                });
            } else {
                var subDiv = newDiv.append('div').classed('contain ' + c.id + '_' + subcombo.name + '_child',true);
                if(subopt.required){if(subopt.required=='true'){subDiv.classed('hidden',true);}}
                subDiv.append('label')
                    .classed('pad1x', true)
                    .style('display','inline-block')
                    .text(subopt.name)
                    .property('title',subopt.description);
                subDiv.append('div')
                    .classed('contain',true)
                    .style('display','inline-block')
                    .append('input')
                    .attr('type','text')
                    .attr('placeholder',subopt.defaultvalue)
                    .attr('class','reset ' + subopt.type)
                    .attr('id',subopt.id);
            }
        });
    }

    return d3.rebind(_instance, _events, 'on');
}