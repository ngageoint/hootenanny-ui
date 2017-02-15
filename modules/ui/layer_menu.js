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
            {isPrimary:true, id:'refDatset',text:'Add Reference Dataset'},
            {isPrimary:false, id:'secondaryDataset', text: 'Add Secondary Dataset'}
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

        /*var div = selection
            .append('div')
            .attr('id','add-dataset-pane')
            .attr('class','add-dataset-pane');*/

        var _sidebarDiv = selection.append('div')
            .classed('col12 pad2 sidebar',true)
            .style('overflow','auto');

        var _form = _sidebarDiv.selectAll('div')
            .data(data)
            .enter()
            .append('form')
            .classed('hootImport round space-bottom1 importableLayer fill-white strong', true)
            .on('submit',function(d){
                d3.event.stopPropagation();
                d3.event.preventDefault();
                var cbox = d3.select(this).select('.combobox-input');
                services.hoot.submitLayer(cbox.node().value, d.isPrimary);
            });

        _form.append('a')
            .classed('button dark animate strong block _icon big plus pad2x pad1y js-toggle active', true)
            .attr('href', '#')
            .text(function(d){
                return d.text;
            })
            .on('click', function () {
                d3.event.stopPropagation();
                d3.event.preventDefault();
                toggleForm(this);
            });

        var _fieldset = _form.append('fieldset')
            .classed('hidden pad1 keyline-left keyline-right keyline-bottom round-bottom', true)
            .attr('id', function(d){
                return d.id;
            });

        var _fieldDiv = _fieldset.append('div')
            .classed('form-field fill-white small keyline-all round space-bottom1', true);

        _fieldDiv.append('label')
            .classed('pad1x pad0y strong fill-light round-top keyline-bottom', true);

        _fieldDiv.append('div').classed('contain',true).append('input')
            .attr('type','text')
            .attr('placeholder','Layers')
            .attr('id',function(d){
                return 'sel' + d.id;
            })
            .classed('reset combobox-input',true)
            .attr('readonly',true);

        _fieldDiv.append('div')
            .classed('form-field col12', true)
            .append('input')
            .attr('type', 'submit')
            .attr('value', 'Add Layer')
            .classed('fill-dark pad0y pad2x dark small strong round', true)
            .attr('border-radius','4px');


        /* === Functions === */

        function toggleForm(elem){
            var parentNode = d3.select(elem.parentNode);
            var hideElem = parentNode.select('fieldset').classed('hidden');
            parentNode.select('fieldset').classed('hidden',!hideElem);            
        }

        function populateLayerCombo(data){
            console.log(data);
            _fieldDiv.selectAll('.combobox-input')
                .each(function(f){
                    d3.select(this).call(d3combobox()
                    .data(_.map(data.layers, function (n) {
                            return {
                                value: n.name,
                                title: n.id
                            };
                        })))   
                })                
        }

        function disableTooHigh() {
            div.style('display', context.editable() ? 'none' : 'block');
        }

        /*=== Populate layer drop down ===*/
        services.hoot.availLayers(populateLayerCombo);
    };
}
