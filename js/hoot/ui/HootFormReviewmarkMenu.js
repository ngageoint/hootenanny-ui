Hoot.ui.hootformreviewmarkmenu = function () 
{
    var _events = d3.dispatch();
    var _instance = {};
    var _currentContainerId;

    
    _instance.createForm = function(containerId, formMetaData) {
        var container;
        try{

            _currentContainerId = containerId
            var formTitle = formMetaData['title'];
           
            if(!formTitle){
                formTitle = 'Hootenanny Form';
            }

            container = _createContainer(containerId);
            var formDiv = _createFormDiv(container)
            var form =  _createForm(container, formDiv, formTitle)
            var fieldset = _createFieldSet(form, formMetaData);


        } catch (error) {
            console.error(error);
        }
    
        return container;
    }

   

    var _createContainer = function(containerId) {
        
        return d3.select('#' + containerId)
                .append('div')
                .attr('id', 'reviewMenuForm' + containerId)
                .on('click', function(){
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                });
    }

    var _createFormDiv = function(container) {
        var left = d3.select('#reviewBookmarksSortDiv').node().offsetLeft;
        var top = d3.select('#reviewBookmarksSortDiv').node().offsetTop;
        var height = d3.select('#reviewBookmarksSortDiv').node().offsetHeight;
        var width = d3.select('#reviewBookmarksSortDiv').node().offsetWidth;
        return container.append('div')
                .classed('contain col3 row8 hoot-menu fill-white keyline-all round modal', true)
                .style('top', (top + height) + 'px')
                .style('left', (left + width) + 'px');
    }
    var _createForm = function(container, formDiv, formTitle) { 

        var form = formDiv.append('form');
        form.classed('round space-bottom1 importableLayer', true);

        var formDiv = form
                .append('div')
                .classed('big pad1y keyline-bottom space-bottom2', true)
                .append('h4')
                .text(formTitle)
                .append('div')
                .classed('fr _icon x point', true)
                .on('click', function () {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    //d3.select('#reviewMenuForm' + _currentContainerId).remove();
                    container.remove();
                });
        return form;
    }

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
                        d.action();
                    });

    }


    return d3.rebind(_instance, _events, 'on');
}