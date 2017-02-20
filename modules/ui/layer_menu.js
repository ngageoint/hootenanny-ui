import _ from 'lodash';
import * as d3 from 'd3';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';
import { svgIcon } from '../svg/index';
import { rendererBackgroundSource } from '../renderer/background_source';
import { services } from '../services/index';


import { behaviorHash } from '../behavior/index';

export function uiLayerMenu(context) {

    return function(selection) {
        var _form = null;

        var data = [
            {isPrimary:true, id:'refDatset',text:'Add Reference Dataset', color: 'orange'},
            {isPrimary:false, id:'secondaryDataset', text: 'Add Secondary Dataset', color: 'violet'}
        ];

        var d_form = [{
            label: 'Layers',
            type: 'fileImport',
            placeholder: 'Select Layer From Database',
            /*combobox: _.map(context.hoot().model.layers
                .getAvailLayers(), function (n) {
                    return n.name;
                }),*/
            //tree: context.hoot().model.folders.getAvailFoldersWithLayers()
        }];

        var _sidebarDiv = selection.append('div')
            .classed('col12 pad2 sidebar',true)
            .style('overflow','auto');

        function renderHootImport(container, data){
            var _form = container.selectAll('div')
                .data(data)
                .enter()
                .append('form')
                .attr('class',function(d){return 'fill-white hootImport round keyline-all contain controller space-bottom1 ' + d.color;})
                .attr('id',function(d){
                    return d.id;
                })
                .on('submit',function(d){
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    if(d3.select(this).classed('hootImport')){showLayerModal(d);}
                    if(d3.select(this).classed('hootView')){removeLayer(d);}
                });

            _form.append('div')
                .attr('class','pad1 inline thumbnail dark big _icon _data')
                .attr('id','viewicon-1')
                .on('click',function(d){
                    console.log('palette');
                });

            _form.append('div').classed('context-menu-click-layer',true);

            _form.append('span')
                .attr('class', 'strong pad1x')
                .attr('id', function(d){
                    return d.id + '_name';
                })
                .text(function (d) {
                    return d.text;
                })
                .style('color','black')
                .style('display', 'inline-block')
                .style('max-width', '70%')
                .style('overflow', 'hidden')
                .style('vertical-align', 'middle');

           _form.append('button')
                .attr('tabindex', -1)                
                .attr('class','keyline-left map-button round-right inline fr contain')
                .call(svgIcon('#icon-plus'));
        }
            

        /* === Functions === */
        function showLayerModal(d){
            var modalbg = d3.select('body')
                .append('div')
                .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
            var modalDiv = modalbg.append('div')
                .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
            
            var _form = modalDiv.append('form')
                .on('submit',function(){
                    d3.event.stopPropagation();
                    d3.event.preventDefault();
                    var cbox = d3.select(this).select('.combobox-input');
                    d3.select('#' + d.id)
                        .classed('hootImport',false)
                        .classed('hootView',true);
                    d3.select('#' + d.id + '_name').text(cbox.node().value);

                    // Replace plus with delete
                    d3.select('#' + d.id).select('use').attr('href','#operation-delete');
                    console.log(cbox.node().title);
                    modalbg.remove();
                    services.hoot.loadLayer(cbox.node().value, d.isPrimary, renderLayer);
                });

            var _header = _form.append('div')
                .classed('keyline-bottom', true);
            _header.append('h4')
                .style('display','inline-block')
                .text(d.text);
            _header.append('div')
                .attr('class','fr')
                .style('display','inline-block')
                .call(svgIcon('#icon-close'))
                .on('click', function () {
                    modalbg.remove();
                });

            var _fieldset = _form.append('fieldset')
                .classed('pad1 round-bottom', true);
                /*.attr('id', d.id);*/

            var _fieldDiv = _fieldset.append('div')
                .classed('form-field fill-white small round space-bottom1', true);

            _fieldDiv.append('div').classed('contain pad1y',true).append('input')
                .attr('type','text')
                .attr('placeholder','Layers')
                .attr('id','sel' + d.id)
                .classed('reset combobox-input',true)
                .attr('readonly',true);

            _fieldDiv.append('div')
                .classed('form-field col12', true)
                .append('input')
                .attr('type', 'submit')
                .attr('value', 'Select Layer')
                .classed('fill-dark pad0y pad2x dark small strong round', true)
                .attr('border-radius','4px');

            services.hoot.availableLayers(populateLayerCombo);
        }

        function renderLayer(extent, mapnik_source) {
            context.extent(extent);
            context.background().addSource(mapnik_source);
            //d3.select(elem).style('display','none');
        }

        function removeLayer(d) {
            var lyrName = d3.select('#' + d.id + '_name').text();
            services.hoot.removeLayer(lyrName, function(mapnik_source){
                context.background().removeSource(mapnik_source, function(lyrId){
                    services.osm.loadedDataRemove(lyrId,function(d){
                        resetSidebar(d);
                    });
                });
            });
        }

        function resetSidebar(d){
            d3.select('#' + d.id)
                .classed('hootImport',true)
                .classed('hootView',false);
            d3.select('#' + d.id).select('use').attr('href','#icon-plus');
            d3.select('#' + d.id + '_name').text(d.text);
        }

        function populateLayerCombo(data){
            var layerCombobox = d3combobox()
                .data(data.layers.map(function (n) {
                            return {
                                value: n.name,
                                title: n.id
                            };
                    })
                );
            d3.select('.modal').selectAll('.combobox-input')
                .each(function(f){
                    d3.select(this).call(layerCombobox)
                   // .on('blur', addLayer)
                   // .on('change', addLayer)
                })
        }

        function disableTooHigh() {
            div.style('display', context.editable() ? 'none' : 'block');
        }

        /*=== Populate layer drop down ===*/
        renderHootImport(_sidebarDiv, data);        
    };
}
