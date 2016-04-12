////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflate.symbology is helper class for controlling conflation layer symbology externally
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      7 Jan. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


Hoot.control.conflate.symbology = function (parent, sidebar) {

    var _events = d3.dispatch();
    var _instance = {};

    /**
    * @desc Changes layer symbolog
    * @param name - name of layer
    * @param color - new color of of the layer
    **/
    _instance.changeSymbology = function (name, color) {
        var confData = parent.getConflationData();

        if(confData){

            var entity = _.find(confData, function(d){
                return d.name === name;
            });

            if(entity) {
                var color = entity.color;

                var modifiedId = entity.mapId.toString();
                var headerSym = d3.select('#conflatethumbicon-' + modifiedId);

                if(headerSym && headerSym.size()>0){

                    var classStr = headerSym.attr('class');
                    var classList = classStr.split(' ');
                    var colorAttrib = _.find(classList,function(cls){
                        return cls.indexOf('fill-') === 0;
                    });


                    if(color === 'osm') {
                        headerSym.classed('data', false);
                        headerSym.classed('_osm', true);

                        if(colorAttrib){
                            headerSym.classed(colorAttrib, false);
                        }
                    } else {
                        headerSym.classed('_osm', false);
                        headerSym.classed('data', true);

                        if(colorAttrib){
                            headerSym.classed(colorAttrib, false);
                            headerSym.classed('fill-' + color, true);
                        } else {
                            headerSym.classed('fill-' + color, true);
                        }
                    }

                }
            }

        }

    };
    return d3.rebind(_instance, _events, 'on');
}