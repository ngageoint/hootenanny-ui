////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.control.conflate.advancedoptions.selectiondisplay is dialog containing user selected advanced options.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      7 Jan. 2016
//      14 Apr. 2016 eslint changes -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


Hoot.control.conflate.advancedoptions.selectiondisplay = function () {

    var _events = d3.dispatch();
    var _instance = {};

    /**
    * @desc Create dialog
    * @param confAdvOptsDlg - parent dialog (Advanced options dlg)
    * @param confAdvOptionsFields - Fields meta data
    * @param fieldValues - Fields values
    **/
    _instance.advancedValuesDlg = function (confAdvOptsDlg, confAdvOptionsFields, fieldValues) {
        try{    
            var advancedValuesEvents = d3.dispatch('exitadvvals');
            if(!confAdvOptsDlg){return;}
            
            var modalbg = d3.select('#CustomConflationForm').node().parentNode;
            var ingestDiv = d3.select(modalbg)
                .append('div')
                .attr('id','CustomConflationValues')
                .classed('fillL map-overlay col8 custom-conflation',true);
    
            ingestDiv.append('div')
            .classed('big pad1y pad1x keyline-bottom space-bottom2', true)
                .append('h4')
                .text('Advanced Conflation Values')
                .append('div')
                .classed('fr _icon x point', true)
                .attr('id','CloseCustomConflationFormBtn')
                .on('click', function () {
                        advancedValuesEvents.exitadvvals();
                });
    
            //for each field, provide value/placeholder
            if(!confAdvOptionsFields){return;}
            var d_json = fieldValues;
            var d_table = ingestDiv.append('div')
                .classed('big pad1x keyline-bottom space-bottom2',true)
                .style({'max-height': '800px','overflow-y': 'auto','width':'99%'})
                .append('table').attr('id','advValTable').classed('custom-conflation-table',true);
            var thead = d3.select('#advValTable').append('thead');
            var tbody = d3.select('#advValTable').append('tbody');
            
            // create the table header
            var thead = d3.select('thead').selectAll('th')
                .data(d3.keys(d_json[0]).splice(0,3))
                .enter().append('th').text(function(d){return d.toLowerCase();});
            
            // fill the table
            // create rows
            var tr = d3.select('tbody').selectAll('tr')
                .data(d_json).enter().append('tr')
                .attr('id',function(d){return 'tr_' + d.id;});
    
            // cells
            var td = tr.selectAll('td')
              .data(function(d){
                return [d.key,d.value,d.group];})
              .enter().append('td')
              .text(function(d) {
                return d;})
              .style('word-break','break-all');
    
            return d3.rebind(ingestDiv, advancedValuesEvents, 'on');
        } catch(err){
            alert(err);
            return null;
        }
    };
    return d3.rebind(_instance, _events, 'on');
};