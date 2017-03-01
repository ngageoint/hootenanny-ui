import _ from 'lodash';
import * as d3 from 'd3';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';
import { svgIcon } from '../svg/index';
import { rendererBackgroundSource } from '../renderer/background_source';
import { services } from '../services/index';

export function uiLayerMenu(context) {

    return function(selection) {

        var data = [
            {id: 'reference', text: 'Add Reference Dataset', color: 'violet'},
            {id: 'secondary', text: 'Add Secondary Dataset', color: 'orange'}
        ];
        //t('geocoder.no_results_worldwide')


        var layerMenu = selection.append('div')
            .classed('col12 pad2',true)
            .call(renderLayerMenu, this)
            ;

        function renderLayerMenu(container) {
            services.hoot.availableLayers(function(layers) {
                data.forEach(function(lyr) {


                var menus = container
                    // .selectAll('div')
                    // .data(data)
                    // .enter()
                    .append('div');
                // menus.exit().remove();
                // menus.merge(menus);
                menus.attr('class', function(d) { return lyr.color; })
                    .classed('fill-white round keyline-all contain space-bottom1', true)
                    .attr('id',function(d){
                        return lyr.id;
                    });

                menus.append('div')
                    .attr('class','pad1 inline thumbnail dark big _icon data')
                    .on('click', function(d) {
                        console.log(lyr);
                    });

                var layerCombobox = d3combobox()
                    .data(layers.map(function (n) {
                                return {
                                    value: n.name,
                                    mapid: n.id,
                                    source: lyr.id
                                };
                        })
                    )
                    .on('accept.combobox', loadLayer)
                    ;

                menus.append('input')
                    .attr('type', 'text')
                    .attr('placeholder', function (d) {
                        return lyr.text;
                    })
                    .attr('id', function (d) {
                        return 'input-'+ lyr.id;
                    })
                    .classed('combobox-input', true)
                    .call(layerCombobox)
                    //.on('change', loadLayer)
                    ;

                });
            });
        }

        function renderLayer(extent, mapnik_source) {
            context.extent(extent);
            context.background().addSource(mapnik_source);
            //d3.select(elem).style('display','none');
        }

        // function removeLayer(d, mapid) {
        //     services.hoot.removeLayer(mapid, function(mapnik_source) {
        //         //context.background().toggleOverlayLayer(mapnik_source);
        //         context.background().removeSource(mapnik_source);
        //         services.osm.loadedDataRemove(mapid);
        //         resetSidebar(d);
        //     });
        // }

        // function resetSidebar(d){
        //     var container = d3.select('form[data-layer = "' + d + '"]');

        //    container.classed('hootImport',true)
        //         .classed('hootView',false)
        //         .attr('data-layer',null);
        //     container.select('use').attr('href','#icon-plus');
        //     container.select('span').text(function(){
        //         return container.attr('id') === 'refDatset' ? 'Add Reference Dataset' : 'Add Secondary Dataset';
        //     });
        // }


        function loadLayer(d) {
            console.log(d);
            services.hoot.loadLayer(d.mapid, (d.source === 'reference'), renderLayer);
        }

    };
}
