iD.ui.MapMetadata = function(data) {
    var mapMetadata = {},
        button,
        body,
        loaded,
        showing = false;

    function load(d) {

        function addExpandList(data, label) {
            body.append('a')
                .text(label)
                .attr('href', '#')
                .classed('hide-toggle', true)
                .classed('expanded', false)
                .on('click', function() {
                    var exp = d3.select(this).classed('expanded');
                    container.style('display', exp ? 'none' : 'block');
                    d3.select(this).classed('expanded', !exp);
                    d3.event.preventDefault();
                });

            var container = body.append('div')
                .attr('class', '')
                .style('display', 'none');

            var list = container.append('ul')
                .attr('class', 'layer-list');

            var li = list.selectAll('li')
                .data(data)
                .enter().append('li')
                .classed('tag-row', true);
            li.append('div')
                .classed('map-metadata key keyline-right', true)
                .attr('title', function(d) {
                    return d.key;
                })
                .html(function(d) {
                    return d.key;
                });
            li.append('div')
                .classed('map-metadata value', true)
                .attr('title', function(d) {
                    return d.value;
                })
                .html(function(d) {
                    return d.value;
                });
        }

        function formatPercent(d) {
            return parseFloat(d).toFixed(1) + '%';
        }

        function addExpandTables(data, label) {
            body.append('a')
                .text(label)
                .attr('href', '#')
                .classed('hide-toggle', true)
                .classed('expanded', false)
                .on('click', function() {
                    var exp = d3.select(this).classed('expanded');
                    container.style('display', exp ? 'none' : 'block');
                    d3.select(this).classed('expanded', !exp);
                    d3.event.preventDefault();
                });
            var container = body.append('div')
                .attr('class', '')
                .style('display', 'none');

            var table = container.selectAll('table')
                .data(d3.entries(data))
                .enter().append('table')
                .attr('class', function(d) {
                    return d.key;
                })
                .classed('map-metadata layer-list', true);

            var rows = table.selectAll('tr')
                .data(function(d) {
                    return d3.entries(d.value);
                })
                .enter().append('tr')
                .classed('tag-row', true);

            rows.selectAll('td')
                .data(function(d) {
                    var dv = d3.entries(d.value);
                    return [d.key].concat(dv.map(function(v) {
                        return v.value;
                    }));
                })
                .enter().append('td')
                .html(function(d) {
                    return d;
                })
                .classed('tar', function(d, i) {
                    return i > 0;
                })
                .classed('key', function(d, i) {
                    return i === 0;
                });
        }

        var download = '';
        // params
        if (d.tags && d.tags.params) {
            var params = JSON.parse(d.tags.params.replace(/\\"/g, '"'));
            var pdata = d3.entries({
                'Reference Layer': d.tags.input1Name,
                'Secondary Layer': d.tags.input2Name,
                'Conflation Type': params.CONFLATION_TYPE,
                'Conflated Layer': d.name
            });
            addExpandList(pdata, 'Parameters');

            //Build the download text
            download += 'Parameters:\n';
            pdata.forEach(function(p) {
                download += p.key + '\t' + p.value + '\n';
            });

            // options
            var optdata = d3.entries(params.ADV_OPTIONS).sort(function(a, b) {
                if (a.key < b.key) {
                  return -1;
                }
                if (a.key > b.key) {
                  return 1;
                }
                // a must be equal to b
                return 0;
            });
            addExpandList(optdata, 'Options');

            //Build the download text
            download += '\nOptions:\n';
            optdata.forEach(function(o) {
                download += o.key + '\t' + o.value + '\n';
            });
        }

        // stats
        if (d.tags && d.tags.stats) {
            var stats = d3.tsv.parseRows(d.tags.stats, function(d) {
                var obj = {};
                obj[d.shift()] = d;
                return obj;
            }).reduce(function(pv, cv) {
                return Object.assign(pv, cv);
            }, {});

            var layercounts = {count: {
                1: 'nodes',
                2: 'ways',
                3: 'relations'
            }};
            layercounts[d.tags.input1Name] = {
                nodes: stats['Node Count'][0],
                ways: stats['Way Count'][0],
                relations: stats['Relation Count'][0]
            };
            layercounts[d.tags.input2Name] = {
                nodes: stats['Node Count'][1],
                ways: stats['Way Count'][1],
                relations: stats['Relation Count'][1]
            };
            layercounts[d.name] = {
                nodes: stats['Node Count'][2],
                ways: stats['Way Count'][2],
                relations: stats['Relation Count'][2]
            };
            var layerfeatures = {count: {
                1: 'pois',
                2: 'roads',
                3: 'buildings',
                4: 'waterways'
            }};
            layerfeatures[d.tags.input1Name] = {
                pois: stats['POI Count'][0],
                roads: stats['Highway Count'][0],
                buildings: stats['Building Count'][0],
                waterways: stats['Waterway Count'][0]
            };
            layerfeatures[d.tags.input2Name] = {
                pois: stats['POI Count'][1],
                roads: stats['Highway Count'][1],
                buildings: stats['Building Count'][1],
                waterways: stats['Waterway Count'][1]
            };
            layerfeatures[d.name] = {
                pois: stats['POI Count'][2],
                roads: stats['Highway Count'][2],
                buildings: stats['Building Count'][2],
                waterways: stats['Waterway Count'][2]
            };
            var featurecounts = {
                count: {
                    1: 'unmatched',
                    2: 'merged',
                    3: 'review'
                },
                pois: {
                    unmatched: stats['Unmatched POIs'][2],
                    merged: stats['Conflated POIs'][2],
                    review: stats['POIs Marked for Review'][2]
                },
                roads: {
                    unmatched: stats['Unmatched Highways'][2],
                    merged: stats['Conflated Highways'][2],
                    review: stats['Highways Marked for Review'][2]
                },
                buildings: {
                    unmatched: stats['Unmatched Buildings'][2],
                    merged: stats['Conflated Buildings'][2],
                    review: stats['Buildings Marked for Review'][2]
                },
                waterways: {
                    unmatched: stats['Unmatched Waterways'][2],
                    merged: stats['Conflated Waterways'][2],
                    review: stats['Waterways Marked for Review'][2]
                }
            };
            var featurepercents = {
                percent: {
                    1: 'unmatched',
                    2: 'merged',
                    3: 'review'
                },
                pois: {
                    unmatched: formatPercent(stats['Percentage of Unmatched POIs'][2]),
                    merged: formatPercent(stats['Percentage of POIs Conflated'][2]),
                    review: formatPercent(stats['Percentage of POIs Marked for Review'][2])
                },
                roads: {
                    unmatched: formatPercent(stats['Percentage of Unmatched Highways'][2]),
                    merged: formatPercent(stats['Percentage of Highways Conflated'][2]),
                    review: formatPercent(stats['Percentage of Highways Marked for Review'][2])
                },
                buildings: {
                    unmatched: formatPercent(stats['Percentage of Unmatched Buildings'][2]),
                    merged: formatPercent(stats['Percentage of Buildings Conflated'][2]),
                    review: formatPercent(stats['Percentage of Buildings Marked for Review'][2])
                },
                waterways: {
                    unmatched: formatPercent(stats['Percentage of Unmatched Waterways'][2]),
                    merged: formatPercent(stats['Percentage of Waterways Conflated'][2]),
                    review: formatPercent(stats['Percentage of Waterways Marked for Review'][2])
                }
            };

            addExpandTables({
                layercounts: layercounts,
                layerfeatures: layerfeatures,
                featurecounts: featurecounts,
                featurepercents: featurepercents
            }, 'Statistics');

            addExpandList(d3.entries(stats), 'Statistics (Raw)');

            //Build the download text
            download += '\nStatistics:\n';
            download += '\nLayer Counts:\n';
            d3.select('table.layercounts').selectAll('tr').each(function() {
                download += d3.select(this).selectAll('td').data().join('\t');
                download += '\n';
            });
            download += '\nLayer Features:\n';
            d3.select('table.layerfeatures').selectAll('tr').each(function() {
                download += d3.select(this).selectAll('td').data().join('\t');
                download += '\n';
            });
            download += '\nFeatures Counts:\n';
            d3.select('table.featurecounts').selectAll('tr').each(function() {
                download += d3.select(this).selectAll('td').data().join('\t');
                download += '\n';
            });
            download += '\nFeature Percents:\n';
            d3.select('table.featurepercents').selectAll('tr').each(function() {
                download += d3.select(this).selectAll('td').data().join('\t');
                download += '\n';
            });
            download += '\nStatistics (Raw):\n';
            download += d.tags.stats;
            addDownloadLink(d, download);
        }
        show();
    }

    function addDownloadLink(d, download) {
        body.append('a')
            .text('Download')
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var fileName = d.name.replace(/\s/g, '_');
                var blob = new Blob([download], {type: 'text/tab-separated-values;charset=utf-8'});
                window.saveAs(blob, fileName + '-stats.tsv');
                d3.event.preventDefault();
            });
    }

    function show() {
        loaded = true;

        body.style('display', null);
        body.classed('keyline-top pad1', true);
        body.transition()
            .duration(200)
            .style('max-height', '100%')
            .style('opacity', '1');

        showing = true;
    }

    function hide() {
        body.transition()
            .duration(200)
            .style('max-height', '0px')
            .style('opacity', '0')
            .each('end', function() {
                body.classed('keyline-top pad1', false);
                body.style('display', 'none');
            });

        showing = false;
    }

    mapMetadata.button = function(selection) {
        button = selection.selectAll('.map-metadata-button')
            .data([data]);

        button.enter().append('button')
            .attr('tabindex', -1)
            .attr('class', 'map-metadata-button map-button keyline-left inline _icon info')
            .style('float', 'right')
            .style('position', 'relative');

        button.on('click', function (d) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (showing) {
                hide();
            } else if (loaded) {
                show();
            } else {
                load(d);
            }
        });
    };

    mapMetadata.body = function(selection) {
        body = selection.selectAll('.map-metadata-body')
            .data([0]);

        body.enter().append('div')
            .attr('class', 'map-metadata-body')
            .style('max-height', '0')
            .style('opacity', '0');

        if (showing === false) {
            hide(body);
        }
    };

    mapMetadata.showing = function(_) {
        if (!arguments.length) return showing;
        showing = _;
        return mapMetadata;
    };

    return mapMetadata;
};