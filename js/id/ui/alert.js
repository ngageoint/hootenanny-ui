iD.ui.Alert = function(message,type,stack) {
    var modal = document.getElementById('myModal');
    var alerts = d3.select('#alerts');
    var alertDiv = alerts.append('div')
        .classed('fillD alertDiv overflow',true)
        .on('click',function(){
            clearTimeout(uniqueTimeout);
            d3.select(this).transition().duration(0).style('opacity',1);
        });

    type = type.toLowerCase();

    var displayTime = 10000;
    var fadeTime = 5000;
    var uniqueTimeout = setTimeout(function(){fadeOut(alertDiv);}, displayTime);

    if(type === undefined){type = 'notice';}

    if(type === 'warning'||type === 'error'){alertDiv.classed('red',true);}
    if(type === 'notice'){alertDiv.classed('blue',true);}
    if(type === 'success'){alertDiv.classed('green',true);}

    function modalWindow() {
        var modalbg = d3.select('body').append('div')
            .attr('id','detailDiv')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true)
            .on('click', function() {
                if (d3.event.target === d3.select('#detailDiv').node()) {
                    d3.select('#detailDiv').remove();
                }
            });
        var detailModal = modalbg.append('div')
            .classed('contain col8 pad1 hoot-menu fill-white round detailModal', true);
        detailModal.append('h1')
            .attr('id','detailDivLabel')
            .style({'text-align': 'center'})
            .text('Hoot Core Command Details');
    }

    alertDiv.append('div')
        .classed('fr _icon x dark point', true)
        .on('click',function() {this.parentNode.remove();});

    alertDiv.append('p').html(message);

    alertDiv.append('a').on('click', modalWindow).attr('class', 'detailLink').text('More details');

    var d = new Date().toLocaleString();
    try{
        if(type === 'warning'||type === 'error'){
            Hoot.view.utilities.errorlog().reportUIError(d + ': ' + message,stack);
        }
    } catch(e){
        alert(message);
    }

    function fadeOut(selection){
        selection.style('opacity',1).transition().duration(fadeTime).style('opacity',0).remove();
    }

    ////// ALERT TYPES //////
    /*
     * warning
     * error
     * notice
     * success
     */

    // Colors: Red, Yellow, Green, Blue

    return;
};

