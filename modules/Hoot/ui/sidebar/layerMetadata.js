/*******************************************************************************************************
 * File: layerMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/16/18
 *******************************************************************************************************/

import { select as d3_select } from 'd3-selection';
import { tsvParseRows as d3_tsvParseRows } from 'd3-dsv';

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
        d3_select( `[title="table-${ title }"` ).classed( 'hidden', state );

        wrapperNode.style.height = bodyNode.scrollHeight + 'px';
    }

    createIconButton() {
        this.form.select( '.controller' )
            .append( 'button' )
            .attr( 'tabindex', -1 )
            .classed( 'metadata-button icon-button keyline-left unround inline', true )
            .on( 'click', (d3_event) => {
                d3_event.stopPropagation();
                d3_event.preventDefault();

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
            .data(function ([key, value]) { return Object.entries(value); })
            .enter().append('tr')
            .classed('metadata-row', true);

        rows.selectAll('td')
            .data(function ([key, value]) {
                let dv = Object.entries(value);
                return [key].concat(dv.map((v) => value));
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
            .on('click', function(d3_event) {
                var blob = new Blob([download], {type: 'text/tab-separated-values;charset=utf-8'});
                window.saveAs(blob, `${name.replace(/\s/g, '_')}-stats.tsv`);
                d3_event.preventDefault();
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
            paramData = Object.entries(params);

        if (paramData.length) {
            this.download = 'Parameters:\n';

            paramData.forEach(([key, value]) => {
                this.download += `${key}\t${value}\n`;
            });

            this.createExpandList( paramData, 'Parameters' );
        }

        let optData = Object.entries( this.tags.params.HOOT2_ADV_OPTIONS ).sort( ( [a_key, a_value], [b_key, b_value] ) => {
            if ( a_key < b_key ) {
                return -1;
            }
            if ( a_key > b_key ) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });

        if (optData.length) {
            this.download += '\nOptions:\n';
            optData.forEach(([key, value]) => {
                this.download += `${key}\t${value}\n`;
            });
            this.createExpandList( optData, 'Options' );
        }

        if (this.tags.hasOwnProperty('stats')) {
            let stats = d3_tsvParseRows(this.tags.stats).reduce(function(stats, d) {
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
                    count: {},
                    [RefLayerName]: {},
                    [SecLayerName]: {},
                    [ConflatedLayer]: {}
                },
                featurecounts: {
                    count: {
                        1: 'unmatched',
                        2: 'merged',
                        3: 'review'
                    }
                },
                featurepercents: {
                    percent: {
                        1: 'unmatched',
                        2: 'merged',
                        3: 'review'
                    }
                }
            };

            let featuresCount = 1;

            //Add POI stats if present
            if (stats.POIs) {
                tableConfig.layerfeatures.count[featuresCount] = 'pois';
                tableConfig.layerfeatures[RefLayerName].pois = stats.POIs[0];
                tableConfig.layerfeatures[SecLayerName].pois = stats.POIs[1];
                tableConfig.layerfeatures[ConflatedLayer].pois = stats.POIs[2];

                tableConfig.featurecounts.pois = {
                    unmatched: stats['Unmatched POIs'][2],
                    merged: stats['Conflated POIs'][2],
                    review: stats['POIs Marked for Review'][2]
                };
                tableConfig.featurepercents.pois = {
                    unmatched: formatPercent(stats['Percentage of Unmatched POIs'][2]),
                    merged: formatPercent(stats['Percentage of POIs Conflated'][2]),
                    review: formatPercent(stats['Percentage of POIs Marked for Review'][2])
                };
                featuresCount++;
            }

            //Add Road stats if present
            if (stats.Roads) {
                tableConfig.layerfeatures.count[featuresCount] = 'roads';
                tableConfig.layerfeatures[RefLayerName].roads = stats.Roads[0];
                tableConfig.layerfeatures[SecLayerName].roads = stats.Roads[1];
                tableConfig.layerfeatures[ConflatedLayer].roads = stats.Roads[2];

                tableConfig.featurecounts.roads = {
                    unmatched: stats['Unmatched Roads'][2],
                    merged: stats['Conflated Roads'][2],
                    review: stats['Roads Marked for Review'][2]
                };
                tableConfig.featurepercents.roads = {
                    unmatched: formatPercent(stats['Percentage of Unmatched Roads'][2]),
                    merged: formatPercent(stats['Percentage of Roads Conflated'][2]),
                    review: formatPercent(stats['Percentage of Roads Marked for Review'][2])
                };
                featuresCount++;
            }

            //Add Building stats if present
            if (stats.Buildings) {
                tableConfig.layerfeatures.count[featuresCount] = 'buildings';
                tableConfig.layerfeatures[RefLayerName].buildings = stats.Buildings[0];
                tableConfig.layerfeatures[SecLayerName].buildings = stats.Buildings[1];
                tableConfig.layerfeatures[ConflatedLayer].buildings = stats.Buildings[2];

                tableConfig.featurecounts.buildings = {
                    unmatched: stats['Unmatched Buildings'][2],
                    merged: stats['Conflated Buildings'][2],
                    review: stats['Buildings Marked for Review'][2]
                };
                tableConfig.featurepercents.buildings = {
                    unmatched: formatPercent(stats['Percentage of Unmatched Buildings'][2]),
                    merged: formatPercent(stats['Percentage of Buildings Conflated'][2]),
                    review: formatPercent(stats['Percentage of Buildings Marked for Review'][2])
                };
                featuresCount++;
            }

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
                featuresCount++;
            }

            this.download += '\nStatistics:\n';

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

            this.createExpandTables(Object.entries(tableConfig), 'Statistics');
            this.createExpandList(Object.entries(stats), 'Statistics (Raw)');

            this.addDownloadLink(ConflatedLayer);
        }
    }
}
