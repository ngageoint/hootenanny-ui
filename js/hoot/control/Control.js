/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control is parent class for various Hoot controls where it intantiates control submodules.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control = function (context){
	var hoot_control = {};

	hoot_control.utilities = Hoot.control.utilities(context);
	//hoot_control.conflate = new Hoot.control.conflate(context);

	// Override the iD sidebar with hoot sidebar
	hoot_control.loadSidebarControls = function(context, sidebar){
		// Clear existing
		d3.select('.header.fillL.cf').remove();
        d3.select('.search-header').remove();
        d3.select('.feature-list-pane').style('display', 'none');
        d3.select('.sidebar-component').style('background-color', '#fff');
        //d3.selectAll('.save').style('display','none');

        hoot_control.conflate = Hoot.control.conflate(sidebar);
        hoot_control.import = Hoot.control.import(context, sidebar);
        hoot_control.export = Hoot.control.export( sidebar);
        hoot_control.view = Hoot.control.view(sidebar, context);
        hoot_control.conflicts = Hoot.control.conflicts(context, sidebar);
        hoot_control.validation = Hoot.control.validation(context, sidebar);
        
        // tools will go away till then
        Hoot.tools(context, sidebar);
	}

        // TODO: Update this to be more generic..
        hoot_control.createModalDialog = function(context, dlgMetadata, formMetaData, btnMetaData) {
                var modalbg = d3.select('body')
                    .append('div')
                    .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
                var modalDiv = modalbg.append('div')
                    .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
                var _form = modalDiv.append('form');
                _form.classed('round space-bottom1 importableLayer', true)
                    .append('div')
                    .classed('big pad1y keyline-bottom space-bottom2', true)
                    .append('h4')
                    .text(dlgMetadata.label)
                    .append('div')
                    .classed('fr _icon x point', true)
                    .on('click', function () {

                        modalbg.remove();
                    });
                var fieldset = _form.append('fieldset')
                    .selectAll('.form-field')
                    .data(formMetaData);
                fieldset.enter()
                    .append('div')
                    .classed('form-field fill-white small keyline-all round space-bottom1', true)
                    .append('label')
                    .classed('pad1x pad0y strong fill-light round-top keyline-bottom', true)
                    .text(function (d) {
                        return d.label;
                    });
                fieldset.append('div')
                    .classed('contain', true)
                    .append('input')
                    .attr('type', 'text')
                    .attr('placeholder', function (field) {
                        return field.placeholder;
                    })
                    .attr('class', function (field) {
                        return 'reset ' + field.type;
                    })
                    .select(function (a) {
                        if(a.label=='Output Name'){
                            d3.select(this).on('change',function(){
                                //ensure output name is valid
                                var resp = context.hoot().checkForUnallowedChar(this.value);
                                if(resp != true){
                                    d3.select(this).classed('invalidName',true).attr('title',resp);
                                } else {
                                    d3.select(this).classed('invalidName',false).attr('title',null);
                                }
                            });
                        }
                    });

                var submitExp = modalDiv.append('div')
                    .classed('form-field col12 center ', true);


                var btn = submitExp.append('span')
                    .classed('round strong big loud dark center col10 margin1 point', true)
                    .classed('inline row1 fl col10 pad1y', true)
                    .text(btnMetaData.label)
                    .on('click', function () {
                        if(!d3.selectAll('.invalidName').empty()){return;}
                        btnMetaData.action(modalbg, submitExp, _form);
                    });



                return modalbg;

        }
	return hoot_control;
};