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
                    {'label':'Line Width','default_option':true,'type':'number','name':'_linewidth','min':1,'max':25,'step':1,'value':7}
                ]
                }
            ]

            var _fieldset = container.append('form').append('fieldset').selectAll('.form-field').data(settings);
            _fieldset.enter()
                .append('div')
                .append('label').classed('pad1x pad0y strong fl', true)
                .text(function(d){return d.group;})
                .each(function(d){
                    var settingsGroup = d3.select(this.parentNode).append('div').attr('id',d.id);
                    _.each(d.items,function(j){
                        /*this.append('label').classed('settings-label fl',true).attr('for',j.name).text(j.label);
                        var inpt = this.append('input').classed('hoot-input',true).attr('id',j.name).attr('placeholder','');
                        if(j.type=='number'){
                            inpt.attr('type','number').attr('min',j.min).attr('max',j.max);
                        }*/

                        var section = this.append('section');
                        section.append('h3').text('test');
                        var sectionDiv = section.append('div').append('div').classed('settings-row',true);
                        sectionDiv.append('label').append('span').text('SPAN');
                        sectionDiv.append('input').attr('type','number').classed('hoot-input',true).attr('id',j.name).attr('placeholder','');
                    },settingsGroup)
                })
            ;
        };

/*<section id="web-content-section">
    <h3 i18n-content="advancedSectionTitleContent">Web content</h3>
    <div>
      <div class="settings-row">
        <label class="web-content-select-label">
          <span i18n-content="defaultZoomFactorLabel">Page zoom:</span>
          <select id="defaultZoomFactor" datatype="double"><option value="0.25">25%</option><option value="0.333">33%</option><option value="0.5">50%</option><option value="0.666">67%</option><option value="0.75">75%</option><option value="0.9">90%</option><option value="1">100%</option><option value="1.1">110%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="1.75">175%</option><option value="2">200%</option><option value="2.5">250%</option><option value="3">300%</option><option value="4">400%</option><option value="5">500%</option></select>
        </label>
      </div>

    </div>
  </section>*/

	return hoot_view_utilities_uisettings;
}