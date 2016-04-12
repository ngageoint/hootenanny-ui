// Verify but this should be deprecated
Hoot.view.ltdstags = function (context) {
    var meta = {};

    meta.currentTranslation = null;
    meta.currentId = null;


    meta.changeSymbology = function(color){
        var headerSym = d3.select('#ltds_header_sym');
        if(headerSym && headerSym.size()>0){
            var classStr = headerSym.attr('class');
            var classList = classStr.split(' ');
            var colorAttrib = _.find(classList,function(cls){
                return cls.indexOf('fill-') === 0;
            });
            if(colorAttrib){
                headerSym.classed(colorAttrib, false);
                if(color === 'osm'){
                    color = 'dark';
                }
                headerSym.classed('fill-' + color, true);
            }
        }
    };

    meta.deactivate = function () {
        d3.select('.hootTags')
            .remove();
    };
    meta.activate = function (id) {
        function refreshTags() {
            var ent = context.hasEntity(id);
            if (!ent) {
                return;
            }
            var newArray = [];
            var OSMTagsAr = mapTags(ent.tags);

            appendTags(OSMTagsAr);
        }
        context.history().on('undone', refreshTags)
        context.history().on('redone', refreshTags)
        context.history().on('change', refreshTags)

        meta.currentId = id;
        meta.deactivate();
        var ltdsTags;
        var tagsData;
        var getType = function (entity) {
            var obj = {
                'n': 'node',
                'w': 'way',
                'r': 'relation'
            };
            var char = entity.id.charAt(0);
            var type = obj[char];
            if (type === 'node') {
                return 'marker';
            }
            if (type === 'way') {
                var nodes = entity.nodes;
                var shape = (nodes[0] === nodes[nodes.length - 1]) ? 'poly' : 'linestring';
                return shape;
            }
        };

        var getGeomType = function (entity) {
            var obj = {
                'n': 'node',
                'w': 'way',
                'r': 'relation'
            };
            var char = entity.id.charAt(0);
            var type = obj[char];
            if (type === 'node') {
                return 'Point';
            }
            if (type === 'way') {
                var nodes = entity.nodes;
                var shape = (nodes[0] === nodes[nodes.length - 1]) ? 'Area' : 'Line';
                return shape;
            }
        };

        var addTagsBody = function (layerName, type) {

            function getColor(name){
                var layer = context.hoot().model.layers.getLayers(name);
                var color =  layer ? layer.color : 'green';
                return color;
            }


            if (!layerName) {return false;}

            var layerId = context.hoot().model.layers.getmapIdByName(layerName).toString();
            if (!layerId) {return false;}


            type = type || 'linestring';
            d3.select('.hootTags')
                .remove();
            var ltds = d3.select('#sidebar2')
                .append('div')
                .classed('round hootTags form-field form-field-access keyline-all round pad1y pad1x fill-white ', true);

                var color = getColor(layerName);
                var vis = d3.select('.layer_' + layerId).size();
            if (!vis) {
                layerId = d3.select('.hootView').attr('data-layer');
            }


            var el = d3.select('.layer_' + layerId)
                .node()
                .nextSibling;

            d3.select('#sidebar2')
                .node()
                .insertBefore(ltds.node(), el);

            var header = ltds.append('div')
                .classed('form-field big strong keyline-all inline round', true);
            header.append('div')
                .classed('dark big fl _icon ' + type + ' fill-' + color, true);
            header.append('div')
                .attr('id', 'ltds_header_sym')
                .classed('strong pad1x', true)
                .style({
                    'text-align': 'center',
                    'position': 'relative',
                    'top': '9px',
                    'display': 'inline-block',
                    'max-width': '70%',
                    'overflow': 'hidden',
                    'vertical-align': 'middle',
                    'opacity': 1

                })
                .text(id);



            var ftypeWrap = ltds.append('div')
                        .classed('fill-white small round', true)
                        //.style('margin-left', '20px')
                        //.style('margin-right', '20px')
                        .style('margin-top', '10px')
                        .html(function (field) {
                            return '<label class="form-label">' + 'Filter By Type' + '</label>';
                        });
            var placeHolder = 'TDSv61';
            if(meta.currentTranslation) {
                placeHolder = meta.currentTranslation;
            } else {
                meta.currentTranslation = placeHolder;
            }



             var comboIntput = ftypeWrap.append('input')
                        .attr('id', 'ltdstranstype')
                        .attr('type', 'text')
                        .attr('value', placeHolder);

            var comboData = ['OSM','TDSv61', 'TDSv40'];
            var combo = d3.combobox()
                        .data(_.map(comboData, function (n) {
                            return {
                                value: n,
                                title: n
                            };
                        }));

                    comboIntput.style('width', '100%')
                        .call(combo);

            comboIntput.on('change', function(param){
                meta.currentTranslation = d3.select('#ltdstranstype').value();

                meta.activate(id);
            });

            var head_cont = ltds.append('div')
            .classed('form-label pad1x', true);
            var head_label = head_cont.append('label')
                .classed('fl', true)
                .text('Attributes');

            if(meta.currentTranslation == 'OSM') {
                head_cont.append('a')
                .attr('href', '#')
                .text('')
                .classed('button dark fr animate strong block _icon plus js-toggle', true)
                .on('click', function () {
                    if(meta.currentId) {
                        var ent = context.hasEntity(id);
                        if (!ent) {
                            return;
                        }

                        var OSMTagsAr = [];
                        var emptyTag = {};
                        emptyTag["key"] = "";
                        emptyTag["value"] = "";
                        OSMTagsAr.push(emptyTag);
                        appendTags(OSMTagsAr, true);
                    }
                });
            }




            ltdsTags = ltds.append('div')
                .classed('cf preset-input-wrap', true)
                .style({
                    'max-height': '300px',
                    'overflow': 'scroll'
                })
                .attr('id','ltdstagslistcontainer')
                .append('ul')
                .classed('ltdsTags keyline-bottom', true);

                ltdsTags.append('div')
                .classed('ltdsLoading',true)
                .text('Loading Features....');
        };
        var mapTags = function (tags, fields) {
            return _.map(tags, function (d, e) {

                var obj = {};
                obj.key = e;
                obj.value = d;

                if(fields){
                    var col = _.find(fields, function(item){
                        return item.desc == e;
                    });
                    obj.field = col;
                }

                return obj;
            });
        };
        var getLTDSTags = function (entity, callback) {
            if (!entity.origid) {
                callback(false);
            }
            var geom = getGeomType(entity);
            var filterType = d3.select('#ltdstranstype').value();
            var origid = entity.origid.replace(/[A-Za-z$-]/g, '');
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' + JXON.stringify(entity.asJXON()) + '</osm>';
            var data = {};
            data.id = origid;
            data.osmXml = osmXml;
            data.translation = filterType;
            data.geom = geom;
            Hoot.model.REST('LTDS', data, function (resp) {
                if(resp.error){
                    context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                    return;
                }
                if (callback) {
                    callback(resp);
                }
            });
        };

        var getOSMTags = function (entity, callback) {
            if (!entity.origid) {
                callback(false);
            }
            var filterType = d3.select('#ltdstranstype').value();
            var origid = entity.origid.replace(/[A-Za-z$-]/g, '');
            var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'JOSM\'>' + JXON.stringify(entity.asJXON()) + '</osm>';
            var data = {};
            data.id = origid;
            data.translation = filterType;
            data.osmXml = osmXml;
            Hoot.model.REST('TDSToOSM', data, function (resp) {
                if(resp.error){
                    context.hoot().view.utilities.errorlog.reportUIError(resp.error);
                    return;
                }
                if (callback) {
                    callback(resp);
                }
            });
        };


        var getRawOSMTags = function(entity, callback) {
            if (!entity.origid) {
                callback(false);
            }

            var attrib = {};

            for (var key in entity.tags) {
                attrib[key] = entity.tags[key];
            }
            var ret = {};
            ret.tableName = '';
            ret.attrs = attrib;
            callback(ret);
        }


        var appendTags = function (tags, isNew) {
            if(!ltdsTags || !tags){return;}

            if(isNew){
                if(tagsData.length == 1){
                    if(tagsData[0].key.trim().length == 0 || tagsData[0].value.trim().length == 0){
                        iD.ui.Alert("Please save last new attribute before adding new.",'warning',new Error().stack);
                        return;
                    }
                }
            }
            ltdsTags.select('.ltdsLoading').remove();
            if(isNew !== true) {
                ltdsTags.selectAll('li').remove();
            }

            tagsData = tags;
            var tagHolder = ltdsTags.selectAll('ul')
                .data(tags)
                .enter();
            var li = tagHolder.append('li')
                .classed('cf preset-access-access pad0x', true);


            if(isNew === true) {
                li.append('div')
                .classed('keyline-right col5 label preset-label-access', true)
                .style({
                    'height': 'auto',
                    'font-size': '12px'
                })
                .append('input')
                .style('margin-bottom', '1px')
                .style('margin-top', '1px')
                .style('margin-right', '1px')
                .style('border', 'none')
                .attr('type', 'text')
                .classed('preset-input-access combobox-input', true)

                .value(function (d) {
                    return d.key;
                })
                .on('change', function(curr_entity){
                    tagsData[0].key =  this.value;
                });
            } else {
                li.append('div')
                .classed('keyline-right col5 label preset-label-access', true)
                .style({
                    'height': 'auto',
                    'font-size': '12px'
                })
                .text(function (d) {
                    return d.key;
                });
            }

            li.append('div')
                .classed('col6 preset-input-access-wrap', true)
                .style('background-color', '#fff')
                .append('input')
                .style('margin-bottom', '1px')
                .style('margin-top', '1px')
                .style('margin-right', '1px')
                .style('border', 'none')
                .attr('type', 'text')
                .classed('preset-input-access combobox-input', true)

                .value(function (d) {
                    return d.value;
                })
                .on('change', function(orig_entity){
                    if(orig_entity.field){
                        if(orig_entity.field.type == "enumeration"){

                        } else if(orig_entity.field.type == "String") {

                        } else {
                            // numeric
                            if (isNaN(this.value)) // this is the code I need to change
                            {
                                iD.ui.Alert("Please enter a numeric value!",'warning',new Error().stack);
                                if(this.oldValue){
                                    this.value = this.oldValue;
                                } else {
                                    this.value = orig_entity.value;
                                }
                                return ;
                            }
                        }
                    }

                    if(orig_entity.key.trim().length == 0) {
                        iD.ui.Alert('Missing or invalid key.','warning',new Error().stack);
                        var curval = this.value;
                        this.value = "";
                        return;
                    }



                    this.oldValue = this.value;
                    var curItem = this;

                    var new_entity = {};
                    _.forEach(tagsData, function(item){
                        if(item.key == orig_entity.key){
                            item.value = curItem.value;
                        }
                        new_entity[item.key] = item.value;
                    });

                    new_entity[orig_entity.key] = this.value;

                    if(meta.currentTranslation == 'OSM') {
                        context.entityEditor().changeTags(new_entity, id);
                    } else {
                        //getOSMTags
                        var ent2 = context.hasEntity(id);
                        var orig_tags = ent2.tags;
                        ent2.tags = new_entity;
                        getOSMTags(ent2, function (d) {
                            ent2.tags = {};
                            if (d.attrs) {
                                var OSMTagsAr = mapTags(d.attrs);
                                var OSMEntities = {};
                                _.forEach(OSMTagsAr, function(tagElem){
                                    OSMEntities[tagElem.key] = tagElem.value;
                                });
                                context.entityEditor().changeTags(OSMEntities, id);
                            }

                        });
                    }

                })
                .select(function (a) {
                    if(a.field){

                        if(a.field.type == "enumeration"){
                            var combo = d3.combobox()
                            .data(_.map(a.field.enumerations, function (n) {
                                return {
                                    value: n.name,
                                    title: n.name + " (" + n.value + ")"
                                };
                            }));
                            d3.select(this)
                                .style('width', '99%')
                                .call(combo);
                        } else if(a.field.type == "String") {

                        } else {
                            // numeric
                        }

                    }

                });


                if(meta.currentTranslation == 'OSM') {
                    var btnCnt = li.append('div')
                    .classed('keyline-left col1', true);

                    btnCnt.append('button')
                        .classed('pad0 fr _icon trash', true)
                        .style('height', '100%')
                        .on('click', function(v){
                            var ent = context.hasEntity(id);
                            if (!ent) {
                                return;
                            }
                            var newArray = [];
                            var OSMTagsAr = mapTags(ent.tags);
                            for(var jj=0; jj<OSMTagsAr.length; jj++){
                                if(OSMTagsAr[jj].key !== v.key)
                                {
                                    newArray.push(OSMTagsAr[jj]);
                                }
                            }

                            var OSMEntities = {};
                            _.forEach(OSMTagsAr, function(tagElem){
                                if(tagElem.key !== v.key)
                                OSMEntities[tagElem.key] = tagElem.value;
                            });
                            //ent.tags = OSMEntities;
                            context.entityEditor().removeTags(OSMEntities, id);

                            appendTags(newArray);
                        });
                }


        };




        var ent = context.hasEntity(id);
        if (!ent) {
            return;
        }
        var hoot = ent.mapId;
        var layerName = ent.layerName || ent.tags.hoot;
        var type = getType(ent);
        addTagsBody(layerName, type);
        if (!hoot) {
            var tagsAr = mapTags(ent.tags);
            appendTags(tagsAr);
            return;
        }
        if(meta.currentTranslation && meta.currentTranslation == 'OSM') {
            getRawOSMTags(ent, function (d) {
                if (d.attrs) {
                    var schema = null;
                    if(d.fields){
                        schema = JSON.parse(d.fields);
                    }
                    var OSMTagsAr = mapTags(d.attrs, null);
                    appendTags(OSMTagsAr);
                }
                var tagsAr = mapTags(ent.tags);
                //appendTags(tagsAr);
            });
        } else {
            getLTDSTags(ent, function (d) {
                if (d.attrs) {
                    var schema = null;
                    if(d.fields){
                        schema = JSON.parse(d.fields);
                    }
                    var LTDSTagsAr = mapTags(d.attrs, schema.columns);
                    appendTags(LTDSTagsAr);
                }
                var tagsAr = mapTags(ent.tags);
                //appendTags(tagsAr);
            });
        }

    };
    return meta;
};