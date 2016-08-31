/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.view
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.view = function (container, context) {
    var event = d3.dispatch('layerRemove', 'layerVis', 'layerColor');
    var View = {};
    View.render = function (options) {

        var sidebar = container
            .selectAll('forms')
            .data([options])
            .enter();
        var form = sidebar.insert('form', '.loadingLayer');
        form.attr('class', function (d) {
            var modifiedId = d.mapId.toString();
            return 'fill-white hootView layer_' + modifiedId + ' round keyline-all contain controller space-bottom1 ' + d.color;
        })
            .attr('data-layer', function (d) {
                var modifiedId = d.mapId.toString();
                return modifiedId;
            })
            .attr('data-color', function (d) {
                return d.color;
            });
        var _a = form.append('div');

        //add context menu
        _a.on('contextmenu',function(d){
            var items = [{title:'Zoom to Layer',click:'zoom2layer'}];
             // create the div element that will hold the context menu
            d3.selectAll('.context-menu').data([1])
                .enter()
                .append('div')
                .attr('class', 'context-menu');
            // close menu
            d3.select('body').on('click.context-menu', function() {d3.select('.context-menu').style('display', 'none');});
            // this gets executed when a contextmenu event occurs
            d3.selectAll('.context-menu')
                .html('')
                .append('ul')
                .selectAll('li')
                .data(items).enter()
                .append('li')
                .on('click' , function(item) {
                    switch (item.click) {
                    case 'zoom2layer': context.zoomToExtent(d.extent.minlon, d.extent.minlat, d.extent.maxlon, d.extent.maxlat); break;
                    default: break;
                    }
                    d3.select('.context-menu').remove();
                })
                /*.attr('class',function(item){return '_icon ' + item.icon})*/
                .text(function(item) { return item.title; });
            d3.select('.context-menu').style('display', 'none');
            // show the context menu
            d3.select('.context-menu')
                  .style('left', (d3.event.pageX - 2) + 'px')
                  .style('top', (d3.event.pageY - 2) + 'px')
                  .style('display', 'block');
            //} else {d3.select('.context-menu').style('display', 'none');}
            d3.event.preventDefault();
        });


        _a.append('div').attr('class', function (d) {
            if(d.color === 'osm'){
                return 'pad1 inline thumbnail dark big _icon _osm ';
            }
            var icons = (d.merged) ? 'conflate' : 'data';
            return 'pad1 inline thumbnail dark big _icon ' + icons;
        })
        .attr('id', function(d){
            var modifiedId = d.mapId.toString();
            return 'viewicon-' + modifiedId;
        })
        .on('click', function(d){
            var paletteDiv = d3.select('#palette-'+d.id);
            if(!paletteDiv.empty()){
                if(paletteDiv.style('display')!=='none'){
                    paletteDiv.style('display','none');
                }else{
                    paletteDiv.style('display','block');
                }
            }
            //context.hoot().toggleColor(d.name);
        });
        var spn = _a.append('span')
            .attr('class', 'strong pad1x')
            .text(function (d) {
                return d.name;
            })
            .style('display', 'inline-block')
            .style('max-width', '70%')
            .style('overflow', 'hidden')
            .style('vertical-align', 'middle');
        spn.select(function () {
                _a.append('button').attr('class', function () {
                    return 'keyline-left map-button round-right inline _icon trash';
                })
                 .style('float', 'right')
                .style('position', 'relative')
                .on('click', function (a) {
                    d3.event.stopPropagation();
                    d3.event.preventDefault();

                    if (context.mode().id === 'add-point' || context.mode().id === 'draw-line' || context.mode().id === 'draw-area'){
                        iD.ui.Alert('Sorry, this is not allowed while editing. Please finish drawing your line or area, then delete the layer', 'error', new Error().stack);
                        return;
                    }

                    var primaryLayerName = '';
                    var sels = d3.select(form.node().parentNode).selectAll('form')[0];
                    if(sels && sels.length > 0){
                        primaryLayerName = d3.select(sels[0]).datum().name;
                    }

                    var hasChange = context.history().hasChanges();

                    var msg = '';
                    if(hasChange) {
                        msg = 'There is unsaved changes. ';
                    }
                    var r = confirm(msg + 'Are you sure you want to remove layer:' + a.name  + '?');
                    if (r === false) {
                       return;
                    }
                    var isPrimary = false;
                    if(a.name === primaryLayerName){
                        isPrimary = true;
                    }


                    form.remove();
                    event.layerRemove(a.name, isPrimary, a.mapId);
                    // this removes the tags field
                    d3.select('.hootTags').remove();
                    context.ui().sidebar.adjustMargins();
                    context.updateMode();

                });
                //Add map metadata (params, stats) display control
                if (_a.datum().tags && (_a.datum().tags.params || _a.datum().tags.stats)) {
                    spn.style('max-width', '60%');
                    var mapMetadata = iD.ui.MapMetadata(_a.datum(), context);
                    _a.call(mapMetadata.button).call(mapMetadata.body);
                }
        });


        var palette = _.filter(context.hoot().palette(), function(d){return d.name!=='green';});
        if(options.merged){
            palette = Hoot.hoot().palette();
        }
        var paletteFieldset = form.append('fieldset');
        var mapid = options.id || options.mapId || 0;
        paletteFieldset
            .attr('id','palette-'+mapid.toString())
            .classed('pad1 keyline-top', true)
            .style('border-top', '1px solid rgba(0, 0, 0, 0.2)')
            .style('height', '60px')
            .style('display','none');

        paletteFieldset
            .append('div')
            .classed('keyline-all form-field palette clearfix round space-bottom1', true)
            .style('width', 'auto')
            .selectAll('a')
            .data(palette)
            .enter()
            .append('a')
            .attr('class', function (p) {
                var active = (options.color === p.name) ? ' active _icon check' : '';

                var osm = '';
                if(p.name === 'osm'){
                    osm = ' _osm';
                }
                return 'block fl keyline-right' + active + osm;
            })
            .attr('href', '#')
            .attr('data-color', function (p) {
                return p.name;
            })
            .style('background', function (p) {
                return p.hex;
            })
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                d3.select(this.parentNode)
                    .selectAll('a')
                    .classed('active _icon check', false);
                d3.select(this)
                    .classed('active _icon check', true);

                var selColor = d3.select(this).datum().name;

                var lyr = context.hoot().model.layers.getLayers(options.name);
                if(lyr){
                    lyr.color = selColor;
                    if(selColor === 'osm'){
                        context.hoot().removeColor(options.mapId);
                    } else {
                        context.hoot().replaceColor(options.mapId,selColor);
                    }
                    form.attr('data-color', selColor);
                    var modifiedId = lyr.mapId.toString();
                    form.attr('class', 'fill-white hootView layer_' + modifiedId +
                        ' round keyline-all contain controller space-bottom1 ' + selColor);

                    var iconSym = d3.select('#viewicon-' + modifiedId);

                    if(iconSym && iconSym.size()>0){
                        if(selColor === 'osm') {
                            iconSym.classed('data', false);
                            iconSym.classed('conflate', false);
                            iconSym.classed('_osm', true);
                        } else {
                            var curricon = (options.merged) ? 'conflate' : 'data';
                            iconSym.classed('_osm', false);
                            iconSym.classed(curricon, true);
                        }

                    }


                    context.hoot().model.layers.changeLayerCntrlBtnColor(options.mapId.toString(), selColor);
                    event.layerColor(options.name, selColor, options.mapId);
                    if(context.hoot().control.conflate){
                        context.hoot().control.conflate.symbology.changeSymbology(options.name);
                    }

                }
            });
        var params = form.append('fieldset');
        params
            .classed('pad1 keyline-top hidden', true)
            .style('border-top', '1px solid rgba(0, 0, 0, 0.2)');
        params.append('div')
            .classed('form-field fill-white small keyline-all round space-bottom1', true)
            .html(function () {
                return '<label class="pad1x pad0y strong fill-light round-top keyline-bottom">Name</label>';
            })
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', options.name)
            .attr('class', 'reset conflateName');
        var viewOptions = params.append('div')
            .classed('form-field pill col12', true);
        viewOptions.append('input')
            .attr('type', 'submit')
            .attr('value', 'Delete')
            .classed('fill-darken0 button round pad0y pad2x small strong margin0 conflictSaveOptions', true)
            .on('click', function (d) {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                form.remove();
                event.layerRemove(d.name);
            });
        viewOptions.append('input')
            .attr('type', 'submit')
            .attr('value', 'Save')
            .classed('fill-dark round pad0y pad2x dark small strong space-bottom0 margin0 conflictSaveOptions', true)
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
            });
        context.ui().sidebar.adjustMargins();
    };

    View.getLayer = function (iLayer){
        var layer = null;
        var sels = d3.select('#sidebar2').selectAll('form')[0];
        if(sels && sels.length > iLayer){
            layer = d3.select(sels[iLayer]).datum();
        }
        return layer;
    };


    return d3.rebind(View, event, 'on');
};
