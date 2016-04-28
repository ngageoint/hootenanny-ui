iD.behavior.MeasureDrawArea = function(context,svg) {
    var event = d3.dispatch('move', 'click','cancel', 'finish','dblclick'),
        closeTolerance = 4,
        tolerance = 12,
        nodeId=0,
        polygon,label,lengthLabel,areaLabel,
        points='',loc='',
        ptArr=[],rectArr=[],
        lastPoint=null,firstPoint=null,
        totDist=0,
        segmentDist=0,
        lastSegmentDist=0,
        rectMargin=30;
    
    function ret(element) {
        // reset variables
        nodeId=0; points=''; loc=''; ptArr=[]; rectArr=[];
        lastPoint=null; firstPoint=null;
        totDist=0; segmentDist=0; lastSegmentDist=0;        
        d3.event.preventDefault();
        element.on('dblclick',undefined);
        event.finish();
    }


    
    function radiansToMeters(r) {
        // using WGS84 authalic radius (6371007.1809 m)
        return r * 6371007.1809;
    }
    
    function steradiansToSqmeters(r) {
        // http://gis.stackexchange.com/a/124857/40446
        return r / 12.56637 * 510065621724000;
    }
        
    function getArea(){  
        //build rect arr
        rectArr=[firstPoint];
        rectArr = rectArr.concat(ptArr);
        rectArr.push(context.map().mouseCoordinates());
        rectArr.push(firstPoint);
        
        var json = {type: 'Polygon',coordinates: [rectArr]};
        var area = d3.geo.area(json);
        
         if (area > 2 * Math.PI) {
             json.coordinates[0] = json.coordinates[0].reverse();
             area = d3.geo.area(json);
         }
         
         area = steradiansToSqmeters(area);
         
         return area;
    }
    
    function displayArea(m2) {
        var imperial = context.imperial;
        
        var d = m2 * (imperial ? 10.7639111056 : 1),
            d1, d2, p1, p2, unit1, unit2;

        if (imperial) {
            if (d >= 6969600) {     // > 0.25mi² show mi²
                d1 = d / 27878400;
                unit1 = 'mi²';
            } else {
                d1 = d;
                unit1 = 'ft²';
            }

            if (d > 4356 && d < 43560000) {   // 0.1 - 1000 acres
                d2 = d / 43560;
                unit2 = 'ac';
            }

        } else {
            if (d >= 250000) {    // > 0.25km² show km²
                d1 = d / 1000000;
                unit1 = 'km²';
            } else {
                d1 = d;
                unit1 = 'm²';
            }

            if (d > 1000 && d < 10000000) {   // 0.1 - 1000 hectares
                d2 = d / 10000;
                unit2 = 'ha';
            }
        }

        // drop unnecessary precision
        p1 = d1 > 1000 ? 0 : d1 > 100 ? 1 : 2;
        p2 = d2 > 1000 ? 0 : d2 > 100 ? 1 : 2;

        var retval = String(d1.toFixed(p1)) + ' ' + unit1 +
        (d2 ? ' (' + String(d2.toFixed(p2)) + ' ' + unit2 + ')' : '');
        return retval.replace(/\B(?=(\d{3})+(?!\d))/g, ',');        
    }
    
    function displayLength(m){
        var imperial = context.imperial;
        
        var d = m * (imperial ? 3.28084 : 1),
            p, unit;
    
        if (imperial) {
            if (d >= 5280) {
                d /= 5280;
                unit = 'mi';
            } else {
                unit = 'ft';
            }
        } else {
            if (d >= 1000) {
                d /= 1000;
                unit = 'km';
            } else {
                unit = 'm';
            }
        }
    
        // drop unnecessary precision
        p = d > 1000 ? 0 : d > 100 ? 1 : 2;
    
        return String(d.toFixed(p)) + ' ' + unit;
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
                polygon.classed('complete',true);
            });
            
            element.on('mousemove.drawarea', null);

        d3.select(window).on('mouseup.drawarea', function() {
            element.on('mousemove.drawarea', mousemove);
            if (iD.geo.euclideanDistance(pos, point()) < closeTolerance ||
                (iD.geo.euclideanDistance(pos, point()) < tolerance &&
                (+new Date() - time) < 500)) {

                // Prevent a quick second click
                d3.select(window).on('click.drawarea-block', function() {
                    d3.event.stopPropagation();
                }, true);

                context.map().dblclickEnable(false);

                window.setTimeout(function() {
                    context.map().dblclickEnable(true);
                    d3.select(window).on('click.drawarea-block', null);
                }, 500);

                click();
            }
        });
    }

    function mousemove() {
        if(polygon.classed('updated')){
            points = polygon.attr('points');
            polygon.classed('updated',false);
        }

        var c = context.projection(context.map().mouseCoordinates());
        if(nodeId>0){
            //ptArr[1]=context.map().mouseCoordinates();
            ptArr.splice(ptArr.length-1,1);
            ptArr.push(context.map().mouseCoordinates());
            

            polygon.attr('points',points.concat(' ' + c.toString()));
            polygon.attr('loc',loc.concat(' ' + context.map().mouseCoordinates().toString()));

            var distance = d3.geo.distance(lastPoint,context.map().mouseCoordinates());
            distance = radiansToMeters(distance);
            segmentDist=distance;
            
            if(nodeId>1){
                lastSegmentDist=radiansToMeters(d3.geo.distance(firstPoint,context.map().mouseCoordinates()));
            } else {lastSegmentDist=0;}
            
            var currentDist = segmentDist+totDist+lastSegmentDist;
            
            label.attr('x', c[0]+rectMargin)
                .attr('y', c[1]+rectMargin)
                .attr('loc', context.map().mouseCoordinates());
            lengthLabel.attr('x', c[0]+10)
                .attr('y', c[1])
                .text(function() { return displayLength(currentDist);});
            areaLabel.attr('x', c[0]+10)
                .attr('y', c[1]+25)
                .text(function(){return displayArea(getArea());});
         }
    }
    
    function click() {
        if(d3.event.which !== 1){return false;}

        if(polygon.classed('updated')){
            points = polygon.attr('points');
            polygon.classed('updated',false);
        }

        var c = context.projection(context.map().mouseCoordinates());
        
        points = points + ' ' + c;
        loc = loc + ' ' + context.map().mouseCoordinates();
        
        if(nodeId===1){
            ptArr.splice(ptArr.length-1,1);
            for (var i = 0; i < 2; i++) {ptArr.push(context.map().mouseCoordinates());}
        } else if (nodeId>1){
            ptArr.splice(ptArr.length-1,1);
            for (var j = 0; j < 2; j++) {ptArr.push(context.map().mouseCoordinates());}
        }
                
        svg.append('g')
            .classed('node point',true)
            .attr('id','measure-vertex-'+nodeId)
            .attr('transform','translate('+c[0]+ ',' + c[1] + ')')
            .attr('loc',context.map().mouseCoordinates);

        totDist = totDist + segmentDist;
        segmentDist = 0;
        
        if(nodeId>=0){
            if(nodeId===0){firstPoint=context.map().mouseCoordinates();}
            
            lastPoint=context.map().mouseCoordinates();
            
            label.attr('x', c[0]+rectMargin)
                .attr('y', c[1]+rectMargin)
                .attr('loc', context.map().mouseCoordinates())
                .classed('measure-label-text',true)
                .style('fill','white')
                .style('font-size','18px'); 
            lengthLabel.attr('x', c[0]+10)
                .attr('y', c[1])
                .text(function() { return displayLength(totDist+lastSegmentDist);});
            areaLabel.attr('x', c[0]+10)
                .attr('y', c[1]+25)
                .text(function(){return displayArea(getArea());});
            
            lastPoint=context.map().mouseCoordinates();
        }   
        nodeId++;
    }
  
    function drawarea(selection) {
        //create polygon, label
        var g = svg.append('g');
        polygon = g.append('polygon')
            .classed('measure-area',true)
            .style('stroke','white')
            .style('stroke-width','2px')
            .style('stroke-linecap','round')
            .style('fill','black')
            .style('fill-opacity','0.3')
            .attr('points','')
            .attr('loc','');

        
        label = g.append('text')
            .style('fill','white')
            .style('font-size','18px');
        
        lengthLabel = label.append('tspan').text('');
        areaLabel = label.append('tspan').text('');
        
        selection
            .on('mousedown.drawarea', mousedown)
            .on('mousemove.drawarea', mousemove);

        return drawarea;
    }

    drawarea.off = function(selection) {
        selection
            .on('mousedown.drawarea', null)
            .on('mousemove.drawarea', null);

        d3.select(window)
            .on('mouseup.drawarea', null);
    };

    return d3.rebind(drawarea, event, 'on');
};