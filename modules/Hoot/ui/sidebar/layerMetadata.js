/*******************************************************************************************************
 * File: layerMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/16/18
 *******************************************************************************************************/

export default class LayerMetadata {
    constructor( context, form, layer ) {
        this.context  = context;
        this.form     = form;
        this.layer    = layer;
        this.tags     = layer.tags;
        this.metadata = null;
        this.download = '';
    }

    render() {
        this.createIconButton();
        this.createInnerWrapper();
        this.createBody();
        this.parseTags();
    }

    /**
     * Opens and closes the metadata panel. CSS height transition becomes disabled when open
     * to avoid unwanted side effects when expanding the tag lists
     */
    togglePanel() {
        let formState    = this.form.classed( 'expanded' ),
            wrapper      = this.innerWrapper,
            wrapperState = this.innerWrapper.classed( 'visible' ),
            wrapperNode  = this.innerWrapper.node();

        // remove listener so class isn't re-added to element
        function onEnd() {
            wrapper.classed( 'no-transition', true );
            wrapperNode.removeEventListener( 'transitionend', onEnd );
        }

        if ( wrapperNode.clientHeight ) {
            // close panel and re-enable transition
            this.innerWrapper.classed( 'no-transition', false );
            wrapperNode.style.height = '0';
        } else {
            // open panel
            let bodyNode = this.body.node();

            wrapperNode.style.height = bodyNode.clientHeight + 'px';
            // disable transition when panel is completely open
            wrapperNode.addEventListener( 'transitionend', onEnd, false );
        }

        this.form.classed( 'expanded', !formState );
        this.innerWrapper.classed( 'visible', !wrapperState );
    }

    toggleList( container, title ) {
        let state       = container.classed( 'expanded' ),
            wrapperNode = this.innerWrapper.node(),
            bodyNode    = this.body.node();

        container.classed( 'expanded', !state );
        d3.select( `[title="table-${ title }"` ).classed( 'hidden', state );

        wrapperNode.style.height = bodyNode.scrollHeight + 'px';
    }

    createIconButton() {
        this.form.select( '.controller' )
            .append( 'button' )
            .attr( 'tabindex', -1 )
            .classed( 'metadata-button icon-button keyline-left unround inline', true )
            .on( 'click', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                this.togglePanel();
            } )
            .append('i')
            .classed('material-icons', true)
            .attr('title', 'show metadata')
            .text('info_outline');
    }

    createInnerWrapper() {
        this.innerWrapper = this.form.append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    createBody() {
        this.body = this.innerWrapper.append( 'div' )
            .classed( 'metadata-body', true );
    }

    createExpandList( data, title ) {
        let container,
            table,
            tr,
            mapMeta = this;

        container = this.body.append( 'a' )
            .classed( 'hide-toggle-button expand-title', true )
            .text( title )
            .on( 'click', () => mapMeta.toggleList( container, title ) );

        table = this.body.append( 'table' )
            .attr( 'title', `table-${ title }` )
            .classed( 'metadata-table round hidden', true );

        tr = table.selectAll( 'tr' )
            .data( data ).enter()
            .append( 'tr' )
            .classed( 'metadata-row', true );

        tr.append( 'td' )
            .classed( 'metadata metadata-key keyline-right', true )
            .attr( 'title', d => d.key )
            .html( d => d.key );

        tr.append( 'td' )
            .classed( 'metadata metadata-value', true )
            .attr( 'title', d => d.value )
            .append( 'p' )
            .html( d => d.value );
    }

    createExpandTables(data, title) {
        let container, table, tr, mapMeta = this;

        container = this.body.append('a')
            .classed('hide-toggle-button expand-title', true)
            .text(title)
            .on('click', () => mapMeta.toggleList(container, title));

        table = this.body.append('div')
            .classed('hidden', true)
            .attr( 'title', `table-${ title }` )
            .selectAll('table')
            .data(data)
            .enter().append('table')
            .attr('class', function (d) { return `metadata-table round ${d.key}`; });

        let rows = table.selectAll('tr')
            .data(function (d) { return d3.entries(d.value); })
            .enter().append('tr')
            .classed('metadata-row', true);

        rows.selectAll('td')
            .data(function (d) {
                let dv = d3.entries(d.value);
                return [d.key].concat(dv.map((v) => v.value));
            })
            .enter().append('td')
            .classed('metadata', true)
            .classed('metadata-key keyline-right', function (d, i) { return i === 0; })
            .text(d => d);
    }

    formatPercent(d) {
        return parseFloat(d).toFixed(1) + '%';
    }

    addToDownload(value) {
        Object.keys(value).forEach((k) => {
            this.download += `${k}\t${Object.values(value[k]).join('\t')}\n`;
        });
    }

    addDownloadLink(name) {
        let download = this.download;
        this.body.append('a')
            .text('Download')
            .attr('href', '#')
            .classed('hide-toggle-button expand-title', true)
            .on('click', function() {
                var blob = new Blob([download], {type: 'text/tab-separated-values;charset=utf-8'});
                window.saveAs(blob, `${name.replace(/\s/g, '_')}-stats.tsv`);
                d3.event.preventDefault();
            });
    }


    parseTags() {
        //null check
        if (!this.tags.params) return;

        let RefLayerName = this.tags.input1Name || 'Reference Layer Missing',
            SecLayerName = this.tags.input2Name || 'Secondary Layer Missing',
            ConflationType = this.tags.params.CONFLATION_TYPE,
            ConflatedLayer = this.layer.name,
            params = {
                'Reference Layer': RefLayerName,
                'Secondary Layer': SecLayerName,
                'Conflation Type': ConflationType,
                'Conflated Layer': ConflatedLayer
            },
            formatPercent = this.formatPercent,
            paramData = d3.entries(params);

        if (paramData.length) {
            this.download = 'Parameters:\n';

            paramData.forEach((p) => {
                this.download += `${p.key}\t${p.value}\n`;
            });

            this.createExpandList( paramData, 'Parameters' );
        }

        let optData = d3.entries( this.tags.params.HOOT2_ADV_OPTIONS ).sort( ( a, b ) => {
            if ( a.key < b.key ) {
                return -1;
            }
            if ( a.key > b.key ) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });

        if (optData.length) {
            this.download += '\nOptions:\n';
            optData.forEach((o) => {
                this.download += `${o.key}\t${o.value}\n`;
            });
            this.createExpandList( optData, 'Options' );
        }

        if (this.tags.hasOwnProperty('stats')) {
            let stats = d3.tsvParseRows(this.tags.stats).reduce(function(stats, d) {
                stats[d.shift()] = d;
                return stats;
            }, {});

            //Ugly hack, but sometimes the first line of stats output doesn't get a hard return
            //causing it to munge with Nodes
            let statsNodes = stats.Nodes || stats['stats = (stat) OR (input map 1 stat) (input map 2 stat) (output map stat)Nodes'];

            const tableConfig = {
                layercounts: {
                    count: {
                        1: 'nodes',
                        2: 'ways',
                        3: 'relations'
                    },
                    [RefLayerName]: {
                        nodes: statsNodes[0],
                        ways: stats.Ways[0],
                        relations: stats.Relations[0]
                    },
                    [SecLayerName]: {
                        nodes: statsNodes[1],
                        ways: stats.Ways[1],
                        relations: stats.Relations[1]
                    },
                    [ConflatedLayer]: {
                        nodes: statsNodes[2],
                        ways: stats.Ways[2],
                        relations: stats.Relations[2]
                    }
                },
                layerfeatures: {
                    count: {
                        1: 'pois',
                        2: 'roads',
                        3: 'buildings'
                    },
                    [RefLayerName]: {
                        pois: stats.POIs[0],
                        roads: stats.Roads[0],
                        buildings: stats.Buildings[0]
                    },
                    [SecLayerName]: {
                        pois: stats.POIs[1],
                        roads: stats.Roads[1],
                        buildings: stats.Buildings[1]
                    },
                    [ConflatedLayer]: {
                        pois: stats.POIs[2],
                        roads: stats.Roads[2],
                        buildings: stats.Buildings[2]
                    }
                },
                featurecounts: {
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
                        unmatched: stats['Unmatched Roads'][2],
                        merged: stats['Conflated Roads'][2],
                        review: stats['Roads Marked for Review'][2]
                    },
                    buildings: {
                        unmatched: stats['Unmatched Buildings'][2],
                        merged: stats['Conflated Buildings'][2],
                        review: stats['Buildings Marked for Review'][2]
                    }
                },
                featurepercents: {
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
                        unmatched: formatPercent(stats['Percentage of Unmatched Roads'][2]),
                        merged: formatPercent(stats['Percentage of Roads Conflated'][2]),
                        review: formatPercent(stats['Percentage of Roads Marked for Review'][2])
                    },
                    buildings: {
                        unmatched: formatPercent(stats['Percentage of Unmatched Buildings'][2]),
                        merged: formatPercent(stats['Percentage of Buildings Conflated'][2]),
                        review: formatPercent(stats['Percentage of Buildings Marked for Review'][2])
                    }
                }
            };

            //Add waterways stats if present
            if (stats.Waterways) {
                tableConfig.layerfeatures.count['4'] = 'waterways';
                tableConfig.layerfeatures[RefLayerName].waterways = stats.Waterways[0];
                tableConfig.layerfeatures[SecLayerName].waterways = stats.Waterways[1];
                tableConfig.layerfeatures[ConflatedLayer].waterways = stats.Waterways[2];

                tableConfig.featurecounts.waterways = {
                    unmatched: stats['Unmatched Waterways'][2],
                    merged: stats['Conflated Waterways'][2],
                    review: stats['Waterways Marked for Review'][2]
                };
                tableConfig.featurepercents.waterways = {
                    unmatched: formatPercent(stats['Percentage of Unmatched Waterways'][2]),
                    merged: formatPercent(stats['Percentage of Waterways Conflated'][2]),
                    review: formatPercent(stats['Percentage of Waterways Marked for Review'][2])
                };
            }

            this.download += '\nStatistics:\n';

            if (ConflatedLayer.includes('Differentials')) {
                // eslint-disable-next-line radix
                let poiOrig = parseInt(stats.POIs[0]), poiNew = parseInt(stats['New POIs'][3]),
                    // eslint-disable-next-line radix
                    buildOrig = parseInt(stats.Buildings[0]), buildNew = parseInt(stats['New Buildings'][3]),
                    // eslint-disable-next-line radix
                    kmOrig = parseInt(stats.Buildings[0]) / 1000.0, kmNew = parseInt(stats['New Buildings'][3]);


                tableConfig.diffstats = {
                    Differential: {
                        1: 'original',
                        2: 'new',
                        3: 'total'
                    },
                    POIs: {
                        original: poiOrig,
                        new: poiNew,
                        total: poiOrig + poiNew
                    },
                    Buildings: {
                        original: buildOrig,
                        buildNew: buildNew,
                        total: poiOrig + poiNew
                    },
                    kmOrig: {
                        original: kmOrig.toFixed.toFixed(2),
                        kmNew: kmNew.toFixed(2),
                        total: (kmOrig + kmNew).toFixed(2)
                    }
                };

                this.download += '\nDiff Stats:\n';
                this.addToDownload(tableConfig.diffstats);
            }

            this.download += '\nLayer Counts:\n';
            this.addToDownload(tableConfig.layercounts);

            this.download += '\nLayer Features:\n';
            this.addToDownload(tableConfig.layerfeatures);

            this.download += '\nFeature Counts:\n';
            this.addToDownload(tableConfig.featurecounts);

            this.download += '\nFeature Percents:\n';
            this.addToDownload(tableConfig.featurepercents);
            this.download += '\nStatistics (Raw):\n';
            this.download += this.tags.stats;

            this.createExpandTables(d3.entries(tableConfig), 'Statistics');
            this.createExpandList(d3.entries(stats), 'Statistics (Raw)');

            this.addDownloadLink(ConflatedLayer);
        }
    }
}
