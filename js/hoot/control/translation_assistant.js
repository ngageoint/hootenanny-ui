/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.TranslationAssistant
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//      14 Apr. 2016 eslint changes -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.control.TranslationAssistant = function (context) {
    var ta = {};
    var tags = {};

    d3.csv('data/osm-plus-taginfo.csv', function(error, csv) {
        if (error) return window.console.warn(error);
        tags.OSM = d3.nest()
            .key(function(d) { return d.Tag; })
            .entries(csv)
            .map(function(d) {
                return {key: d.key,
                        value: d.values.map(function(v) { return v.Value; })
            };
        });
    });

    d3.json('data/tdsv61_field_values.json', function(error, json) {
        if (error) return window.console.warn(error);
        tags.TDSv61 = d3.entries(json).map(function(d) {
            return {key: d.key,
                        value: d.value
            };
        });
    });


    var sidebar = d3.select('#translationAssistant')
                      .classed('noselect', true);

    var options = [{name:'OSM', enabled:true, checked:true},
                   {name:'TDSv61', enabled:true}
                   ];

    var schema = sidebar.append('div')
        .attr('class', 'fill-darken0 pad1 space-bottom1');

    schema.append('label')
        .attr('class', 'inline')
        .html('Tag Schema');

    var schema_options = schema
        .selectAll('input label')
        .data(options);

    var opts = schema_options.enter().append('span')
        .attr('class', 'inline pad0');
    opts.append('input')
        .attr('class', 'inline schema-option')
        .attr('type', 'radio')
        .attr('name', 'schema')
        .attr('id', function(d) { return d.name; })
        .attr('value', function(d) { return d.name; })
        .property('disabled', function(d) { return !d.enabled; })
        .property('checked', function(d) { return d.checked; });
    opts.append('label')
        .attr('class', 'inline')
        .attr('for', function(d) { return d.name; })
        .html(function(d) { return d.name; });

    schema.append('div')
        .classed('preset-input-access hidden', true);

    var hootServices = '/hoot-services';

    var openfile = sidebar.append('div');
    openfile.append('a')
        .classed('space-bottom1 button dark animate strong block _icon big plus wd48 mr1 ml1 pad1 js-toggle', true)
        .attr('href','#')
        .text('Upload file(s)')
        .on('click', function() {
            d3.select(this).select('input').node().click();
        })
        .append('input')
        .attr('type', 'file')
        .attr('multiple', 'true')
        .attr('accept', '.shp, .shx, .dbf, .zip')
        .classed('hidden', true)
        .on('change', function () {
            upload.call(this, 'FILE');
        });

    openfile.append('a')
        .classed('space-bottom1 button dark animate strong block _icon big plus wd48 ml1 pad1 js-toggle', true)
        .attr('href','#')
        .text('Upload folder')
        .on('click', function() {
            d3.select(this).select('input').node().click();
        })
        .append('input')
        .attr('type', 'file')
        .attr('multiple', 'false')
        .attr('webkitdirectory', '')
        .attr('directory', '')
        .classed('hidden', true)
        .on('change', function () {
            upload.call(this, 'DIR');
        });

    function upload(type) {
        d3.selectAll('a, div').classed('wait', true);
        var formData = new FormData();
        for(var i=0; i<this.files.length; i++) {
            var f = this.files[i];
            formData.append(i, f);
        }

        //reset the file input value so on change will fire
        //if the same files/folder is selected twice in a row, #5624
        this.value = null;

        d3.json(hootServices + '/ogr/info/upload?INPUT_TYPE=' + type)
            .post(formData, function(error, json) {
                if (error || json.status === 'failed') {
                    showError('Upload request failed.\n' + error);
                    return;
                }
                pollJob(json.jobId, loadAttrValues);
            });
    }

    function pollJob(jobId, callback) {
        d3.json(hootServices + '/job/status/' + jobId, function(error, json) {
            if (error || json.status === 'failed') {
                window.console.warn(error || json.statusDetail);
                showError('Job failed.\n' + json.statusDetail);
                return;
            }
            if (json.status === 'complete') {
                callback(jobId);
            }
            if (json.status === 'running') {
                setTimeout(function() {
                    pollJob(jobId, callback);
                }, 2000);
            }
        });
    }

    function showError(err) {
        d3.selectAll('a, div').classed('wait', false);

        err += '\n\nFiles can be one or more shapefiles, consisting of .shp, .shx, and .dbf components at a minimum.';
        err += '\n\nOr a zip file containing one or more shapefiles or a folder that is a file geodatabase.';
        err += '\n\nFolders can contain one or more shapefiles or be a file geodatabase.';

        iD.ui.Alert(err,'error',new Error().stack);
        /*openfile.append('div')
        .text(err)
        .style('color', 'red')
        .classed('space-bottom1 inline', true)
        .transition()
        .duration(7000)
        .style('opacity', 0)
        .remove();*/
    }

    function loadAttrValues(jobId) {
        d3.json(hootServices + '/ogr/info/' + jobId, function(error, json) {
            if (error) {
                window.console.warn(error);
                showError('Retrieving unique attributes failed.\n' + error);
                return;
            }
            d3.selectAll('a, div').classed('wait', false);
            initMapping(convertUniqueValues(json), jobId);
        });
    }

    //Convert json to necessary d3.map/d3.set data structure for the UI
    function convertUniqueValues(json) {
        var map = {};
        d3.values(json).forEach(function(v) {
            d3.entries(v).forEach(function(e) {
                var obj = d3.map();
                d3.entries(e.value).forEach(function(a) {
                    //Omit empty fields
                    if (a.value.length > 0)
                        obj.set(a.key, d3.set(a.value));
                });
                map[e.key] = obj;
            });
        });
        return map;
    }

    sidebar.append('div')
        .classed('preset-input-access hidden', true);

    var mapping = sidebar
        .append('form')
        .classed('round space-bottom1 attribute-mapping', true);

    function initMapping(attributeValuesMap, fileName) {
        var layers = d3.keys(attributeValuesMap);
        var layer = layers[0];
        var attributeValues;
        var attributes, mappingSection;
        //var geometry = attributeValues.GEOMETRY[0];

        var currentIndex = {};

        var currentAttribute = {};

        var jsonMapping = {};

        //Remove existing controls
        mapping.selectAll('div, a').remove();

        changeLayers(layer);

        function checkNext() {
            //deactive Next if no lookup node present
            var enable = Boolean(d3.select('.lookup').node());
            d3.select('.next-attribute').classed({'loud': enable, 'disabled': !enable, 'whitetext': enable});
        }

        function getStatus(attr) {
            var status;
            if (!jsonMapping[layer] || !jsonMapping[layer][attr]) {
                status = '&#9744;';
            } else if (jsonMapping[layer][attr] === 'IGNORED') {
                status = '&#9746;';
            } else {
                status = '&#9745;';
            }
            return status + ' ' + attr;
        }

        //Set up the attribute display
        function updateAttributes() {
            attributes.select('div.attributes-count')
                .html(function(d) { return (currentIndex[layer]+1) + ' of ' + d.keys().length + ' Attributes'; });
            attributes.select('div.attributes-sample')
                .html(function(d) {
                    currentAttribute[layer] = d.entries()[currentIndex[layer]];
                    //If we want just one sample value
                    //return d3.values(d)[currentIndex[layer]][0];
                    //If we want three followed by ellipsis
                    return currentAttribute[layer].value.values().reduce(function (prev, curr, idx) {
                        if (idx === 3) {
                            return prev + '...';
                        }
                        if (idx > 3) {
                            return prev;
                        }
                        return prev + ', ' + curr;
                    });
                });
            var attmapping = attributes.select('div.attributes-name')
                .selectAll('div')
                .data([currentAttribute[layer]], function(d) { return d.key; });
            attmapping.enter().append('div')
                .classed('attributes-option', true);
            attmapping.classed('attributes-hover', false)
                .html(function(d) {
                    return getStatus(d.key);
                })
                .on('click', function() {
                    var attmappings = attributes.select('div.attributes-name').selectAll('div')
                        .data(attributeValues.entries(), function(d) { return d.key; });
                    attmappings.enter().append('div')
                        .classed('attributes-option attributes-hover', true);
                    attmappings.html(function(d) {
                        return getStatus(d.key);
                    })
                    .on('click', function(d, i) {
                        //window.console.log(d3.select(this).node().parentNode);
                        //d3.select(d3.select(this).node().parentNode).selectAll('div').remove();
                        currentIndex[layer] = i;
                        updateAttributes();
                    });
                    attmappings.exit().remove();
                });
            attmapping.exit().remove();

            d3.selectAll('.lookup').remove();
            checkNext();

            //Check jsonMapping if lookups exist, is not ignored, and should be populated
            if (jsonMapping[layer][currentAttribute[layer].key] && jsonMapping[layer][currentAttribute[layer].key] !== 'IGNORED') {
                var mapping = d3.map(jsonMapping[layer][currentAttribute[layer].key]);
                mapping.entries().forEach( function(d) {
                      var lookup = mappingSection.insert('div', '.add-mapping')
                      .classed('round space-bottom1 fill-white keyline-all lookup', true);
                      var value = d.key;
                      var schemaOption = d3.select('input[type=radio].schema-option:checked').attr('value');

                      var values = tags[schemaOption].filter(function(val) {
                          return val.key && val.key.toLowerCase()  === value.toLowerCase();
                      });
                      selectTag(lookup, (values.length > 0) ? values[0] : {key: d.key, value: []});
                });
            }

            //Have at least one layer mapping at least one attribute to save the translation
            if (layers.some(function(d) {
                //Have at least one attribute mapped
                return d3.entries(jsonMapping[d]).some(function(e) {
                    return e.value !== 'IGNORED';
                });
            })) {
                enableTranslate();
            }

        }

        function changeLayers(newLayer) {
            layer = newLayer;
            if (!currentIndex[layer]) currentIndex[layer] = 0;
            if (!jsonMapping[layer]) jsonMapping[layer] = {};
            attributeValues = attributeValuesMap[layer];
            attributes = mapping.selectAll('div.attributes')
                .data([attributeValues]);

            //Append children once
            var newAttributes = attributes.enter()
                .append('div')
                .classed('attributes', true);
            var attributesCount = newAttributes.append('div')
                .classed('dark fill-dark center strong pad0y', true);

            if (layers.length > 1) {
                //Add a combobox with all the layers in the data source
                var layersList = attributesCount.append('div')
                    .classed('preset-input-access', true)
                    .selectAll('input')
                    .data([layers]);

                layersList.enter().append('input')
                .classed('preset-input-access', true)
                .style('margin', '0')
                .style('width', '100%')
                .attr('type', 'text')
                .attr('id', 'preset-input-layer')
                .on('change', function() {
                    changeLayers(d3.select(this).property('value'));
                });

                layersList.property('value', layer).each(function(d) {
                    d3.select(this)
                        .call(d3.combobox()
                            .data(d.map(function(obj) {
                                return {title: obj, value: obj};
                            }))
                        );
                 });

                layersList.exit().remove();

            }

            attributesCount.append('div').classed('arrowicon backarrow', true).on('click', back);
            attributesCount.append('div').classed('attributes-count pad1x', true);
            attributesCount.append('div').classed('arrowicon forwardarrow', true).on('click', forward);
            var currAttribute = newAttributes.append('div')
                    .classed('pad2y', true);
            currAttribute.append('div')
                .classed('attributes-name bigger center strong results-list auto-overflow', true);
            currAttribute.append('div')
                .classed('attributes-sample italic center quiet', true);
            updateAttributes();
            attributes.exit().remove();

            addMappingSection();

            //Set up the navigation buttons
            var navigation = mapping.selectAll('div.navigation')
                .data([attributeValues]);
            navigation.enter()
                .append('div')
                .classed('navigation pad2y auto-overflow', true)
                ;
            var ignore = navigation.selectAll('a.ignore').data([attributeValues]).enter()
                .append('a')
                .classed('button strong bigger pad2 wd48 mr1 ml1 ml1 whitetext ignore', true)
                .attr('href', '#')
                .text('Ignore');
            ignore.on('click', function(d) {
                    updateAttributeMapping(d, 'IGNORED');
                });
            var next = navigation.selectAll('a.next').data([attributeValues]).enter()
                .append('a')
                .classed('button strong bigger pad2 wd48 ml1 next-attribute disabled next', true)
                .attr('href', '#')
                .text('Next');
            next.on('click', function(d) {
                    if (!d3.select(this).classed('disabled')) {
                        var key = d.keys()[currentIndex[layer]];
                        var value = buildAttributeMappingJson(key);
                        updateAttributeMapping(d, value);
                    }
                });
            navigation.exit().remove();

        }

        d3.select(document).on('keydown.translation-assistant', function() {
            switch (d3.event.keyCode) {
                // right arrow
                case 39:
                    forward();
                    break;
                // left arrow
                case 37:
                    back();
                    break;
            }
        });

        function forward() {
            //Advance to the next attribute
            if (currentIndex[layer] < attributeValues.size()-1) {
                currentIndex[layer]++;
            } else {
                currentIndex[layer] = 0;
            }
            updateAttributes();
        }

        function back() {
            //Return to the previous attribute
            if (currentIndex[layer] === 0) {
                currentIndex[layer] = attributeValues.size()-1;
            } else {
                currentIndex[layer]--;
            }
            updateAttributes();
        }

        function selectTag(el, d) {
            var tagKey = d.key;
            //enable Next button
            d3.select('.next-attribute').classed({'loud': true, 'disabled': false, 'whitetext': true});

            //update div to attribute mapping control
            el.text(null);
            var icon = el.append('div')
                .classed('pad1 inline thumbnail fr big _icon blank linktag translate-icon keyline-left', true)
                .on('click', function() {
                    //toggles between three states
                    //1. write attribute values directly to tag values, e.g. NAME=Main St. -> Geographic Name Information : Full Name=Main St.
                    //2. map attribute values to new tag values, e.g. FCC=A30 -> Roadway Type=Motorway
                    //3. link attribute to single tag value. e.g. FCC -> Feature Code=AP030: Road

                    if (d3.select(this).classed('linktag')) {
                        d3.select(this).classed({'linktag': false, 'maptag': true, 'removemaptag': false});
                        el.select('.results-single')
                            .classed('hidden', false);
                        el.select('.results-list')
                            .classed('hidden', true);
                    } else if (d3.select(this).classed('maptag')) {
                        d3.select(this).classed({'linktag': false, 'maptag': false, 'removemaptag': true});
                        el.select('.results-single')
                            .classed('hidden', true);
                        el.select('.results-list')
                            .classed('hidden', false);
                    } else {
                        d3.select(this).classed({'linktag': true, 'maptag': false, 'removemaptag': false});
                        el.select('.results-single')
                            .classed('hidden', true);
                        el.select('.results-list')
                            .classed('hidden', true);
                    }

                });
            el.append('div')
                .classed('pad1 inline thumbnail fr big _icon blank removetag translate-icon', true)
                .on('click', function() {
                    el.remove();
                    checkNext();
                });
            el.append('label')
                .classed('pad1 space-bottom0 center bigger', true)
                .text( tagKey );

            var values = d.value;

            var attributeSingle = el.append('div')
                .classed('auto-overflow results-single keyline-top preset-input-access-single hidden', true);
            attributeSingle.append('input')
                .classed('preset-input-access', true)
                .style('margin', '0')
                .style('width', '100%')
                .attr('type', 'text')
                .attr('id', function() { return 'preset-input-' + hashCode(tagKey); } )
                .each(function() {
                    d3.select(this)
                        .call(d3.combobox()
                            .data(values.map(function(obj) {
                                return {title: obj.replace('_', ' '), value: obj};
                            }))
                        );
                 });

            var attributeMapping = el.append('div')
                .classed('auto-overflow results-list hidden', true);
            var attributeRows = attributeMapping.append('div')
                .classed('preset-input-wrap', true)
                .append('ul')
                .selectAll('li')
                .data(currentAttribute[layer].value.values())
                .enter().append('li')
                ;

            attributeRows.append('div')
                .classed('col6 label keyline-top', true)
                .append('span')
                .text(function(d) {
                    return d;
                });

            var selectPreset = attributeRows.append('div')
                .classed('col6 keyline-top preset-input-access-wrap', true);
            selectPreset.append('input')
                .classed('preset-input-access', true)
                .style('margin', '0')
                .style('width', '100%')
                .attr('type', 'text')
                .attr('id', function(d) { return 'preset-input-' + hashCode(tagKey + d); } )
                .each(function() {
                    d3.select(this)
                        .call(d3.combobox()
                            .data(values.map(function(obj) {
                                return {title: obj.replace('_', ' '), value: obj};
                            }))
                        );
                 });

            //Restore preset dropdown if mapping exists
            if (jsonMapping[layer][currentAttribute[layer].key]) {
                var mapping = d3.map(jsonMapping[layer][currentAttribute[layer].key]);
                mapping.entries().filter( function(entry) {
                    return (d.key === entry.key) && (entry.value !== currentAttribute[layer].key); //entry is attribute (map raw values to tag)
                }).forEach( function(entry) {
                    if (typeof entry.value === 'string') { //entry is single tag value
                        attributeSingle.classed('hidden', false);
                        icon.classed({'linktag': false, 'maptag': true, 'removemaptag': false});
                        d3.select('input#preset-input-' + hashCode(tagKey)).property('value', entry.value);
                    } else { //entry is map of attr:tag values
                        attributeMapping.classed('hidden', false);
                        icon.classed({'linktag': false, 'maptag': false, 'removemaptag': true});
                        d3.map(entry.value).entries().forEach( function(e) {
                            d3.select('input#preset-input-' + hashCode(tagKey + e.key)).property('value', e.value);
                        });
                    }
                });
            }

        }

        function addMappingSection() {


        if (!mapping.select('div.mapping-section').empty()) return;
        //Set up the add attribute mapping section

        //The add tag button
        mappingSection = mapping//.selectAll('div.mapping-section').data([0]).enter()
            .append('div')
            .classed('fill-darken0 pad2 mapping-section', true);
        var addMapping = mappingSection
            .append('div')
            .classed('space-bottom1 add-mapping', true);
        addMapping.append('a')
            .classed('button fill-transp keyline-all block _icon big plus pad2 quiet', true)
            .attr('href', '#')
            .on('click', function() {

                function keydown() {
                    switch (d3.event.keyCode) {
                        // tab
                        case 9:
                            accept();
                            break;
                        // return
                        case 13:
                            d3.event.preventDefault();
                            break;
                        // up arrow
                        case 38:
                            scroll('up',this);
                            d3.event.preventDefault();
                            break;
                        // down arrow
                        case 40:
                            scroll('down',this);
                            d3.event.preventDefault();
                            break;
                    }
                    d3.event.stopPropagation();
                }

                function keyup() {
                    switch (d3.event.keyCode) {
                        // escape
                        case 27:
                            remove();
                            break;
                        // return
                        case 13:
                            accept();
                            break;
                    }
                }

                function scroll(dir,that){
                    var overflowList = d3.select(that).node().nextSibling;
                    var results = d3.select(overflowList).selectAll('div');

                    if(!_.isEmpty(results[0])){
                        var overflowTags = [];
                        for (var i = 0; i < results[0].length; i += 1) {
                            overflowTags.push(results[0][i].innerHTML);
                        }

                        //get index of current
                        var curIdx = overflowTags.indexOf(searchTag.property('value'));

                        if(dir==='up'){curIdx -= 1;}
                        else if(dir==='down'){curIdx += 1;}

                        curIdx = curIdx < 0 ? 0 : curIdx;
                        curIdx = curIdx > overflowTags.length-1 ? overflowTags.length-1 : curIdx;

                        //scroll to curIdx
                        overflowList.scrollTop = results[0][curIdx].offsetTop - overflowList.offsetTop;
                        searchTag.property('value',overflowTags[curIdx]);
                    }
                }

                function change() {
                    //window.console.log(d3.event);

                    var value = searchTag.property('value');
                    //window.console.log(value);
                    var results;
                    if (value.length) {
                        results = tags[schemaOption]
                        .filter( function(val) {
                            return val.key && (val.key.toLowerCase().indexOf(value.toLowerCase()) > -1);
                        });
                    } else {
                        results = [];
                    }

                    updateResults(results, value);
                }

                function updateResults(results, value) {

                    //The search tag results
                    var searchtags = resultsList.selectAll('.search-result')
                        .data(results);

                    searchtags.enter().append('div')
                        .classed('search-result pad1x pad1y keyline-left keyline-top', true);

                    searchtags
                        .html( function(d) { return !d || d.key.replace(value, '<span class="match">' + value + '</span>'); })
                        .on('click', function(d) {
                            var lookup = d3.select(searchTag.node().parentNode);
                            selectTag(lookup, d);
                        })
                        ;

                    searchtags.exit().remove();

                }

                function accept() {
                    var value = searchTag.property('value');
                    if (value.length) {
                        var el = resultsList.select('.search-result:first-child');
                        //If selection is empty, use the user specified value as the tag key
                        var d = (!el.empty() && el.text() === value) ? el.datum() : {key: value, value: []};
                        var lookup = d3.select(searchTag.node().parentNode);
                        selectTag(lookup, d);
                    }
                }

                function remove() {
                    var lookup = d3.select(searchTag.node().parentNode);
                    lookup.remove();
                    checkNext();
                }

                //The tag lookup input
                var lookup = mappingSection.insert('div', '.add-mapping')
                    .classed('round space-bottom1 fill-white keyline-all lookup', true);
                lookup.append('div')
                    .classed('pad1 inline thumbnail big _icon blank searchtag translate-icon keyline-right', true);

                var schemaOption = d3.select('input[type=radio].schema-option:checked').attr('value');

                var searchTag = lookup.append('input')
                    .attr('type', 'text')
                    .attr('placeholder', 'Search tag')
                    .classed('strong bigger pad1x pad2y reset', true)
                    .style('width', 'auto')
                    .on('keydown.searchtag', keydown)
                    .on('keyup.searchtag', keyup)
                    .on('input.searchtag', change);

                searchTag.node().focus();

                var resultsList = lookup.append('div')
                    .classed('auto-overflow results-list', true);
            });

        }

        //Sample mapping
        /*
            {
              'FCC': {
                'A20': {
                  'highway': 'primary',
                  'motor_vehicles': 'yes'
                }
              }
            }
         */

        function buildAttributeMappingJson(parentKey) {
            var json = {};
            d3.selectAll('.lookup').each( function() {
                if (d3.select(this).select('.searchtag').empty()) { //we have a mapping
                    var key = d3.select(this).select('label').text();
                    var mapping = d3.select(this).select('.results-list');
                    var single = d3.select(this).select('.results-single');
                    if (!mapping.classed('hidden')) { //map attribute values to new tag values, e.g. FCC=A30 -> Roadway Type=Motorway
                        var values = {};
                        mapping.selectAll('li').each( function() {
                            var k = d3.select(this).select('span').text();
                            var v = d3.select(this).select('input').property('value');
                            values[k] = v;
                        });
                        var attr = d3.map(values);
                        if (attr.values().some( function(obj) { return obj.length > 0; })) {
                            json[key] = values;
                        } else {
                            json[key] = parentKey;
                        }
                    } else if (!single.classed('hidden')) { //link attribute to single tag value. e.g. FCC -> Feature Code=AP030: Road
                        var value = single.select('input').property('value');
                        if (value.length > 0) {
                            json[key] = value;
                        } else {
                            json[key] = parentKey;
                        }
                    } else { //write attribute values directly to tag values, e.g. NAME=Main St. -> Geographic Name Information : Full Name=Main St.
                        json[key] = parentKey;
                    }
                }
            });
            return json;
        }

        function updateAttributeMapping(d, mapping) {
            var key = d.keys()[currentIndex[layer]];
            jsonMapping[layer][key] = mapping;
            forward();
            updateAttributes();
        }

        function enableTranslate() {
            if (d3.selectAll('.attribute-mapping').selectAll('.conflate').empty()) {
                mapping
                .append('a')
                .classed('button dark animate strong block _icon big conflate pad2x pad1y js-toggle', true)
                .attr('href', '#')
                .text('Save Translation')
                .on('click', function() {

                    //Pretty print the attribute-to-tag mapping
                    var json = JSON.stringify(jsonMapping, null, 4);

                    var output = 'hoot.require(\'translation_assistant\')\n' +
                        '\n' +
                        'var attributeMapping = ' + json + ';\n' +
                        'var fcode;\n' +
                        'var schema;\n' +
                        '\n' +
                        '//translateToOsm - takes \'attrs\' and returns OSM \'tags\'\n' +
                        'var translateToOsm = function(attrs, layerName) {\n' +
                        '    return translation_assistant.translateAttributes(attrs, layerName, attributeMapping, fcode, schema);\n' +
                        '};\n';

                    var schema = d3.select('input[type=radio].schema-option:checked').attr('value');
                    if ( schema === 'TDSv61' ) {
                        var isValid = ta.validateMapping(jsonMapping);
                        if (!isValid.state) {
                            iD.ui.Alert('A mapping for Feature Code is required for ' + isValid.layers.join(', '),'warning');
                            return;
                        }
                        output = output.replace('var schema;', 'var schema = \'' + schema + '\';');
                    }
                    //window.console.log(output);

                    var blob = new Blob([output], {type: 'text/plain;charset=utf-8'});
                    window.saveAs(blob, fileName + '-translation.js');

                    if(window.confirm('Do you want to add this to internal translation list?')){
                        var thisbody = d3.select('#utiltranslation').node();
                        d3.select('#jobsBG').node().appendChild(thisbody);
                        d3.selectAll('.utilHootHead')
                            .classed('fill-white', false)
                            .classed('keyline-bottom', true);
                        d3.select(thisbody.children[0])
                            .classed('fill-white', true)
                            .classed('keyline-bottom', false);

                        //open the ingestDiv and copy values into paste box
                        context.hoot().control.utilities.translation.newTranslationPopup(output);
                    }

                });
            } else {
                d3.selectAll('.conflate')
                .classed('hidden', false);
            }
        }

        //http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
        function hashCode(input) {
            var hash = 0, i, chr, len;
            if (input.length === 0) return hash;
            for (i = 0, len = input.length; i < len; i++) {
                chr   = input.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
    }

    //Make sure Feature Code was mapped
    //Every layer must have a Feature Code or be entirely ignored
    //At least one layer must be mapped (all layers cannot be entirely ignored)
    ta.validateMapping = function(jsonMapping) {
        var lyrs = [];
        var rule1 = d3.entries(jsonMapping).every(function(e) {
                var valid = d3.entries(e.value).some(function(d) {
                    return typeof d.value === 'object' && d3.keys(d.value).indexOf('Feature Code') > -1;
                }) || d3.entries(e.value).every(function(d) {
                    return typeof d.value === 'string' && d.value.indexOf('IGNORED') > -1;
                });
                if (!valid) lyrs.push(e.key);
                return valid;
            });
        var rule2 = d3.entries(jsonMapping).some(function(e) {
                var valid = d3.entries(e.value).some(function(d) {
                    return typeof d.value === 'object' && d3.keys(d.value).indexOf('Feature Code') > -1;
                });
                if (!valid) lyrs.push('at least one layer');
                return valid;
            });
        return {state: rule1 && rule2,
                layers: lyrs};
    };

    return ta;
};

Hoot.control.CreateTranslationAssistantContainer = function (form) {
    form.classed('center margin2 col7 round keyline-all', false);
    form.classed('round keyline-all overflow row90pctmax', true)
            .attr('id', 'translationAssistant');
};
