Hoot.view.utilities.uisettings = function(context) {
	var hoot_view_utilities_uisettings = {};

    hoot_view_utilities_uisettings.createContent = function(form){

        hoot_view_utilities_uisettings.datasetcontainer = form.append('div')
            .classed('col12 fill-white small  row10 overflow keyline-all', true)
            .call(hoot_view_utilities_uisettings.populateuisettings);
    }
	hoot_view_utilities_uisettings.populateuisettings = function(container) {
            if(!container){
                container = hoot_view_utilities_uisettings.datasetcontainer;
            }

            var settings = [
                {'group':'Feature Rendering','id':'ui-settings-feature-rendering',items:[
                    {
                        'label':'Path Width','name':'_pathwidth','default_option':true,
                        'selector':'path','declaration':'stroke-width',
                        'type':'number','min':1,'max':25,'step':1,'value':7}
                    ]
                }
            ]

            var _form = container.append('form').selectAll('.form-field').data(settings);
            _form.enter()
                .append('fieldset')
                .append('div').classed('settings-row',true)
                .append('h3').classed('settings-header',true).text(function(d){return d.group;})
                .each(function(d){
                   var _fieldset = d3.select(this.parentNode);
                    _.each(d.items,function(j){
                        var uiSetting = this.append('div').append('label')
                            .classed('settings-label',true)
                            .text(j.label)
                            .append('input').attr('type',j.type)
                            .classed('hoot-input settings-input',true)
                            .attr('id',j.name).property('disabled',true)
                            .on('change',function(){
                                // Delete rule if it already exists
                                var sheets = document.styleSheets[document.styleSheets.length - 1];
                                _.find(sheets.cssRules, function(cssItem, cssIdx){ 
                                   if(cssItem.selectorText == j.selector){ sheets.deleteRule(cssIdx);return true;};
                                });

                                sheets.insertRule(j.selector + '{' + j.declaration + ':' + this.value + ' !important}',sheets.cssRules.length-1);
                            });
                        if(j.type=='number'){uiSetting.attr('min',j.min).attr('max',j.max).attr('value',j.value);}
                        if(j.default_option==true){
                            this.select('label').append('label').classed('settings-checkbox',true)
                                .attr('for',j.name + '_default').text('Use default value')
                                .append('input').attr('name',j.name + '_default')
                                .attr('type','checkbox').attr('checked',true)
                                .on('change',function(){
                                    d3.select('#' + this.name.replace('_default','')).property('disabled',this.checked);
                                    // Delete rule if it already exists
                                    var sheets = document.styleSheets[document.styleSheets.length - 1];
                                    _.find(sheets.cssRules, function(cssItem, cssIdx){ 
                                       if(cssItem.selectorText == j.selector){ sheets.deleteRule(cssIdx);return true;};
                                    });
                                    if(!this.checked){
                                        sheets.insertRule(j.selector + '{' + j.declaration + ':' + d3.select('#'+j.name).value() + ' !important}',sheets.cssRules.length-1);
                                    }
                                });}
                    },_fieldset);
                })
        };

	return hoot_view_utilities_uisettings;
}