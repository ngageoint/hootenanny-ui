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
                {'label':'Line Width','default_option':true,'type':'number','name':'_linewidth','min':1,'max':25,'step':1,'value':7}
            ]

            var _fieldset = container.append('form').append('fieldset').selectAll('.form-field').data(settings);
            _fieldset.enter()
                .append('div')
                .classed('form-field form-field-lanes modified present',true)
                .each(function(d){
                    if(d.type=='number'){
                        d3.select(this).append('label')
                            .classed('form-label',true)
                            .attr('for',d.name)
                            .text(d.label);
                        d3.select(this).append('input')
                            .attr('type','text')
                            .attr('id',d.name)
                            .attr('placeholder','1');
                        var spinControl = d3.select(this).append('div').classed('spin-control',true);
                        d3.select('.spin-control').append('button').attr('class','increment');
                        d3.select('.spin-control').append('button').attr('class','decrement');
                    }
                });

                // Set click event for all spin-controls
                d3.select('.spin-control').selectAll('button')
                    .on('click', function(d) {
                        d3.event.preventDefault();
                        var input = d3.select('#' + d.name);
                        var num = parseInt(input.node().value || 1, 10);
                        if (isNaN(num)){return;}
                        if(_.contains(this.classList,'increment')){input.node().value = Math.min(d.max,num+1);}
                        else if(_.contains(this.classList,'decrement')){input.node().value = Math.max(d.min,num-1);}
                    });
        };


	return hoot_view_utilities_uisettings;
}