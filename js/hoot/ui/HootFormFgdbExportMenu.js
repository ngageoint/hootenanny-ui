/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.ui.hootformfgdbexportmenu is for creating menu items for book marks list.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      02 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


Hoot.ui.hootformfgdbexportmenu = function ()
{
    var _events = d3.dispatch();
    var _instance = {};

    /**
    * @desc Create basic hoot form
    * @param containerId - id of container div
    * @param formMetaData - meta data object that describes the form
    * @return returns created form.
    **/
    _instance.createForm = function(containerId, formMetaData) {
        var container;
        // try{

            var formTitle = formMetaData.title;

            if(!formTitle){
                formTitle = 'Hootenanny Form';
            }

            container = _createContainer(containerId);
            var formDiv = _createFormDiv(container, containerId);
            var form =  _createForm(container, formDiv, formTitle);
            _createFieldSet(form, formMetaData);


        // } catch (error) {
        //     console.error(error);
        // }

        return container;
    };


    /**
    * @desc Create dark back ground mask
    * @param containerId - id of container div
    * @return returns created div.
    **/
    var _createContainer = function(containerId) {

        return d3.select('#' + containerId)
                .append('div')
                .attr('id', 'reviewMenuForm' + containerId)
                .on('click', function(){
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                });
    };


    /**
    * @desc Create form container div. It checks for the caller button's location
    *       and creates it a the location.
    * @param container - id of container div
    * @return returns created div.
    **/
    var _createFormDiv = function(container, containerId) {
        var left = d3.select('#' + containerId).node().offsetLeft;
        var top = d3.select('#' + containerId).node().offsetTop;
        var height = d3.select('#' + containerId).node().offsetHeight;
        var width = d3.select('#' + containerId).node().offsetWidth;
        return container.append('div')
                .classed('contain col3 row8 hoot-menu fill-white keyline-all round modal', true)
                .style('top', (top + height) + 'px')
                .style('left', (left + width) + 'px');
    };

    /**
    * @desc Create form shell
    * @param container - container div
    * @param formDiv - id of container div
    * @param formTitle - dialog title
    * @return returns created form.
    **/
    var _createForm = function(container, formDiv, formTitle) {

        var form = formDiv.append('form');
        form.classed('round space-bottom1 importableLayer', true);

        form.append('div')
                .classed('big pad1y keyline-bottom space-bottom2', true)
                .append('h4')
                .text(formTitle)
                .append('div')
                .classed('fr _icon x point', true)
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    container.remove();
                });
        return form;
    };

    /**
    * @desc Create form fields. Currently handles textarea, combo and text field
    * @param form - container form
    * @param formMeta - fields meta data
    * @return returns created fields.
    **/
    var _createFieldSet = function(form, formMeta) {

        var container = form.append('div')
        .classed('row6 overflow', true);
        var tla = container.selectAll('div')
            .data(formMeta.data)
            .enter();
        var tla2 = tla.append('div')
            .classed('col12 fill-white small keyline-bottom hoverDiv2', true);
        var tla3 = tla2.append('span')
            .classed('text-left big col12 strong', true)
            .append('a')
            .text(function(d){
                return d.name;
            })
            .on('click', function(d){
                d.action(d);
            });

        tla3
        .append('input')
        .attr('type', 'checkbox');


    };


    return d3.rebind(_instance, _events, 'on');
};