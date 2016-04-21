iD.behavior.Clip = function(context,svg) {
     var event = d3.dispatch('move', 'click','cancel', 'finish','dblclick'),
     closeTolerance = 4,
     tolerance = 12,
     nodeId=0,
     rect,anchorPt;

 function ret(element) {
     d3.event.preventDefault();
     element.on('dblclick',undefined);
     event.finish();
 }

 function mousedown() {

     function point() {
         var p = element.node().parentNode;
         return touchId !== null ? d3.touches(p).filter(function(p) {
             return p.identifier === touchId;
         })[0] : d3.mouse(p);
     }

     var element = d3.select(this),
         touchId = d3.event.touches ? d3.event.changedTouches[0].identifier : null,
         time = +new Date(),
         pos = point();

         element.on('dblclick',function(){
             ret(element);
         });

         element.on('mousemove.cliparea', null);

     d3.select(window).on('mouseup.cliparea', function() {
         element.on('mousemove.cliparea', mousemove);
         if (iD.geo.euclideanDistance(pos, point()) < closeTolerance ||
             (iD.geo.euclideanDistance(pos, point()) < tolerance &&
             (+new Date() - time) < 500)) {

             // Prevent a quick second click
             d3.select(window).on('click.cliparea-block', function() {
                 d3.event.stopPropagation();
             }, true);

             context.map().dblclickEnable(false);

             window.setTimeout(function() {
                 context.map().dblclickEnable(true);
                 d3.select(window).on('click.cliparea-block', null);
             }, 500);

             click();
         }
     });
 }


 function mousemove() {
     var c = context.projection(context.map().mouseCoordinates());

        if(nodeId>0){
            var width = Math.abs(c[0]-anchorPt[0]),
            height = Math.abs(c[1]-anchorPt[1]);

            if(c[0]<anchorPt[0]){
                rect.attr('x',c[0]);
            } else {
                rect.attr('x',anchorPt[0]);
            }

            if(c[1]<anchorPt[1]){
                rect.attr('y',c[1]);
            } else {
                rect.attr('y',anchorPt[1]);
            }

            rect.attr('width',width).attr('height',height);
        }
 }

 function click() {
     var c = context.projection(context.map().mouseCoordinates());

     if(nodeId === 0){
         anchorPt = c;
         rect.attr('x',c[0]).attr('y',c[1]);
         nodeId=1;
     }
     else{
         var bboxPt1 = context.projection.invert([parseFloat(rect.attr('x')),parseFloat(rect.attr('y'))]).toString();
         var bboxPt2 = context.projection.invert([parseFloat(rect.attr('x'))+parseFloat(rect.attr('width')),parseFloat(rect.attr('y'))+parseFloat(rect.attr('height'))]).toString();

         ret(d3.select('#surface'));
         if(!_.isEmpty(context.hoot().model.layers.getLayers())){
            context.hoot().control.utilities.clipdataset.clipDatasetContainer('boundingBox',bboxPt1.concat(',',bboxPt2));
        } else {
            iD.ui.Alert('Add data to map before clipping.','notice',new Error().stack);
        }
         nodeId=0;
     }
 }


 function cliparea(selection) {
     //create rect
     var g = svg.append('g');
     rect = g.append('rect')
            .classed('measure-area',true)
            .style('stroke','white')
            .style('stroke-width','2px')
            .style('stroke-linecap','round')
            .style('fill','black')
            .style('fill-opacity','0.3')
            .attr('x',0)
            .attr('y',0)
            .attr('width','0')
            .attr('height','0');

     selection
         .on('mousedown.cliparea', mousedown)
         .on('mousemove.cliparea', mousemove);

     return cliparea;
 }

 cliparea.off = function(selection) {
     selection
         .on('mousedown.cliparea', null)
         .on('mousemove.cliparea', null);

     d3.select(window)
         .on('mouseup.cliparea', null);
 };

 return d3.rebind(cliparea, event, 'on');
};
