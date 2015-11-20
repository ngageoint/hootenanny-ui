Hoot.control.import = function (context,selection) {
    var event = d3.dispatch('addLayer', 'finished');
    var ETL = {};

    ETL.createTree = function(a){
    	hoot.control.utilities.folder.createFolderTree(a);
    }

    ETL.renderTree = function(a) {
        if(a.tree){
    		ETL.createTree(d3.select(this));
    	}
    }


    ETL.render = function (colors, isPrimary) {
    	context.map().on("maxImportZoomChanged", function(){
            var imp = d3.selectAll('.hootImport')[0];
            if(imp.length){
                for(i=0; i<imp.length; i++){
                    var n = d3.select(d3.selectAll('.hootImport')[0][i]).select('.button').node();
                    if(n){
                        hideForm(n);
                    }
                }
            }
        })

        var palette = _.filter(context.hoot().palette(), function(d){return d.name!=='green';});
        var d_form = [{
            label: 'Layers',
            type: 'fileImport',
            placeholder: 'Select Layer From Database',
            combobox: _.map(context.hoot().model.layers
                .getAvailLayers(), function (n) {
                    return n.name;
                }),
            tree: context.hoot().model.folders
            		.getAvailFoldersWithLayers()
        }];

        var sels = selection.selectAll('forms');
        var sidebar = selection.selectAll('forms')
            .data(colors)
            .enter();
        var _form = null;
        if(isPrimary){
            _form = sidebar.insert('form',":first-child");
        } else {
            _form = sidebar.append('form');
        }

        _form.classed('hootImport round space-bottom1 importableLayer fill-white', true)
            .on('submit', function () {
                submitLayer(this);
            })
            .append('a')
            .classed('button dark animate strong block _icon big plus pad2x pad1y js-toggle', true)
            .attr('href', '#')
            .text(function(){
            	var pnode = d3.select(d3.select(this).node().parentNode);
            	if(isPrimary || pnode.node().nextSibling){return 'Add Reference Dataset';}
                else {return 'Add Secondary Dataset';}
                })
            .on('click', function () {

                /*if(context.map().zoom() >= hootMaxImportZoom)*/{
                    toggleForm(this);
                }
            });
        var fieldset = _form.append('fieldset');
        fieldset.classed('pad1 keyline-left keyline-right keyline-bottom round-bottom hidden', true)
            .selectAll('.form-field')
            .data(d_form)
            .enter()
            .append('div')
            .classed('overflow',true)
            .style({'height':'150px','margin':'0 0 15px'})
            .select(ETL.renderTree);

        fieldset
            .append('div')
            .classed('keyline-all form-field palette clearfix round', true)
            .style('width', 'auto')
            .selectAll('a')
            .data(palette)
            .enter()
            .append('a')
            .attr('class', function (p) {
                var active = (d3.select(this.parentNode)
                    .datum() === p.name) ? ' active _icon check' : '';
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
                d3.select(this.parentNode)
                    .datum(d3.select(this)
                        .datum()
                        .name);
            });
        fieldset
            .append('div')
            .classed('form-field col12', true)
            .append('input')
            .attr('type', 'submit')
            .attr('value', 'Add Layer')
            .classed('fill-dark pad0y pad2x dark small strong round', true)
            .attr('border-radius','4px');



        var submitLayer = function (a) {
            if(context.hoot().model.layers.isLayerLoading() === true){
            	iD.ui.Alert('Please wait utill loading first layer is done!','notice');
                return;
            }

            d3.event.stopPropagation();
            d3.event.preventDefault();

            var self = d3.select(a);
            var color = self.select('.palette .active')
                .attr('data-color');

         // make sure something has been selected
            if(self.select('.sel').empty()){
            	iD.ui.Alert('Please select a dataset to add to the map!','warning');
                return;
            }

            var name,
            	lyrid;
            try{
            	name = d3.select(self.select('.sel').node().parentNode).select('text').text();
            	lyrid = d3.select(self.select('.sel').node().parentNode).select('text').attr('lyr-id');
            } catch(e) {
            	iD.ui.Alert('There was an error adding this layer to the map!','warning');
                return;
            }
            if(!name || !lyrid){iD.ui.Alert('Select Layer to Add','warning');return;}
            if(context.hoot().model.layers.getLayers()[name]){iD.ui.Alert('Layer already exists','warning');return;}
            var key = {
                'name': name,
                'id':lyrid,
                color: color
            };

            context.hoot().model.layers.addLayer(key, function(res){
                if(res == 'showprogress'){
                    self
                    .attr('class', function () {
                        if(color == 'osm'){
                            return 'round space-bottom1 loadingLayer _osm'
                        }
                        return 'round space-bottom1 loadingLayer ' + color;
                    })
                    .select('a')
                    .remove();

                    self.append('div')
                    .classed('contain keyline-all round controller', true)
                    .html('<div class="pad1 inline _loading"><span></span></div>' +
                        '<span class="strong pad1x">Loading &#8230;</span>' +
                        '<button class="keyline-left action round-right inline _icon trash"></button>')
                    .select('button')
                    .on('click', function () {
                        d3.event.stopPropagation();
                        d3.event.preventDefault();
                        if (window.confirm('Are you sure you want to delete?')) {
                            resetForm(self);
                            return;
                        }

                    });
                }
                function addNodeMapnikLayer(d) {
                    var source = {
                            name: d.name,
                            id: d.id,
                            type: 'tms',
                            descriptions: d.name,
                            template: 'http://192.168.33.11:8000/?z={zoom}&x={x}&y={y}&color='
                                + encodeURIComponent(context.hoot().palette(d.color))
                                + '&mapid=' + d.id,
                            scaleExtent: [0,18],
                            overlay: true,
                            projection: 'mercator',
                            subtype: 'density_raster'
                        };
                        context.background().addOrUpdateOverlayLayer(iD.BackgroundSource(source));
                }
                context.hoot().control.view.on('layerColor.background', function(name, color, mapid) {
                    addNodeMapnikLayer({
                        name: name,
                        color: color,
                        id: mapid
                    });
                });
                addNodeMapnikLayer(key);
            });

        };
        var resetForm = function (self) {
            self.select('.controller')
                .remove();
            self
                .insert('a', 'fieldset')
                .attr('href', '#')
                .text('Add dataset')
                .classed('button dark animate strong block js-toggle _icon big plus pad2x pad1y', true)
                .on('click', function () {
                    if(context.map().zoom() >= iD.data.hootConfig.hootMaxImportZoom){
                        toggleForm(this);
                    }
                });
        };

        function toggleForm(selection) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var text = (d3.select(selection)
                .classed('active')) ? false : true;
            d3.select(selection)
                .classed('active', text);
        }


        function hideForm(selection) {
           d3.select(selection)
                .classed('active', false);
        }
    };
    return d3.rebind(ETL, event, 'on');

};
