window.Hoot = {};
var k;
Hoot.hoot = function (context) {
    var mode,
        hoot = {},
        //layers = {},
        availLayers = [];
    

    hoot.model = Hoot.model(context);
    hoot.view = Hoot.view(context);
    hoot.control = Hoot.control(context);
    hoot.center = iD.data.hootConfig.hootMapInitialCenter;
    hoot.zoom = iD.data.hootConfig.hootMapInitialZoom;
    //hoot.utilities = Hoot.Utilities(context);
    hoot.mode = function (opt) {
        if (opt) {
            mode = opt;
        }
        else {
            return mode;
        }

    };

  /*
    hoot.LTDSTags = function () {
        return Hoot.LTDSTags(context);
    };*/
    hoot.load = function (demo, callback) {
        if (demo) {
            hoot.demo = true;
            Hoot.demo(context);
        }
        hoot.model.layers.refresh(function () {
            if (callback) {
                callback();
            }
        });
        Hoot.model.REST('GetTranslationServerStatus', function(){});
        
        Hoot.model.REST('getConflationCustomOpts',function(){});
       
 

        Hoot.model.REST('getMapSizeThresholds', function (thresholds) {
            if(thresholds.error){
                return;
            }
            iD.data.hootConfig.export_size_threshold = 1*thresholds.export_threshold;
            iD.data.hootConfig.ingest_size_threshold = 1*thresholds.ingest_threshold;
            iD.data.hootConfig.conflate_size_threshold = 1*thresholds.conflate_threshold;
        });
    };
    hoot.palette = function (co) {
        var palette = [{
                name: 'gold',
                hex: '#ffcc00'
        }, {
                name: 'orange',
                hex: '#ff7f2a'
        }, {
                name: 'violet',
                hex: '#ff5599'
        }, {
                name: 'purple',
                hex: '#e580ff'
        }, {
                name: 'blue',
                hex: '#5fbcd3'
        }, {
                name: 'teal',
                hex: '#5fd3bc'
        },
            {
                name: 'green',
                hex: '#A7C973'
        },
        {
                name: 'osm',
                hex: ''
         }];
        if (!co) return palette;
        var obj = _.find(palette, function (a) {
            return a.name === co || a.hex === co;
        });
        return (obj.name === co) ? obj.hex : obj.name;
    };
    hoot.changeColor = function (lyrid, color) {
        var modifiedId = lyrid.toString();
        var sheets = document.styleSheets[document.styleSheets.length - 1];
        color = hoot
            .palette(color);
        var lighter = d3.rgb(color)
            .brighter();
        sheets.insertRule('path.stroke.tag-hoot-' + modifiedId + ' { stroke:' + color + '}', sheets.rules.length - 1);
        sheets.insertRule('path.shadow.tag-hoot-' + modifiedId + ' { stroke:' + lighter + '}', sheets.rules.length - 1);
        sheets.insertRule('path.fill.tag-hoot-' + modifiedId + ' { fill:' + lighter + '}', sheets.rules.length - 1);
        sheets.insertRule('g.point.tag-hoot-' + modifiedId + ' .stroke { fill:' + color + '}', sheets.rules.length - 1);
    };
 
    hoot.removeColor = function (lyrid) {
        var isDone = false;
        var modifiedId = lyrid.toString();

        while(!isDone){
            isDone = true;
            var sheets = document.styleSheets[document.styleSheets.length - 1];
            var rulesList = sheets.cssRules;
            var len = rulesList.length;
            for(var i=0; i<len; i++){
                var rule = rulesList[i];
                if(rule.cssText.indexOf('tag-hoot-' + modifiedId) > -1){
                    sheets.deleteRule(i);
                    isDone = false;
                    break;
                }
            }
        }
        
     };


    hoot.replaceColor = function (name, color) {
        hoot.removeColor(name);
        hoot.changeColor(name, color);
    };

    _findLayerStyleRules = function(lyrid) {

        var modifiedId = lyrid.toString();
        var sheets = document.styleSheets[document.styleSheets.length - 1];
        var rulesList = sheets.cssRules;
        var hootRulesList = [];

        _.each(rulesList, function(r){
            if(r.cssText.indexOf('tag-hoot-' + modifiedId) > -1){
                hootRulesList.push(r.cssText);
            }
        });

        return hootRulesList;
    };

    hoot.toggleColor = function(name){
        //get layer id
    	var lyrid = hoot.model.layers.getmapIdByName(name);
    	//find style
        var rules = _findLayerStyleRules(lyrid);
        // if not exist then put by looking into layers
        if(rules.length == 0){
            var lyr = hoot.model.layers.layers[name];
            if(lyr){
                hoot.changeColor(lyrid, lyr.color);
            }
        } else {// eles remove which reveals osm symbology
            hoot.removeColor(lyrid);
        }
        
    };


    hoot.autotune = function (type, data, callback) {
        Hoot.model.REST(type, data, function (res) {
            if (callback) {
                callback(res);
            }
        });
    };


    hoot.loadUtilities = function () {
     /*   if(!hoot.utilities){
            hoot.utilities = Hoot.Utilities(context);
        }*/

        hoot.view.utilities.activate();
        Hoot.control.TranslationAssistant();
    };

    hoot.checkForSpecialChar = function(str){
        var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?|]/); 
        if (pattern.test(str)) {
            return false;
        }
        return true;
   };
   
   hoot.checkForUnallowableWords = function(str){
	   var unallowable = ['root','dataset','datasets','folder'];
	   if(unallowable.indexOf(str.toLowerCase())>=0){return false;}
	   return true;
   }

   hoot.isModeBtnEnabled = function()
   {
        var len = Object.keys(hoot.model.layers.layers).length;
        return len > 0;
   };


    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };
    document.onkeydown = function () {
        if (event.altKey && (event.which === 66)) {
            id.hoot().model.layers.layerSwap();
        } else if (event.altKey && (event.which === 78)) {
            var curlayers = id.hoot().model.layers.getLayers();
            var vis = _.filter(curlayers, function (d) {
                return d.vis;
            }).length;
            if (vis === 0) {
                _.each(curlayers, function (d) {
                    if (d.loadable) {
                        id.hoot().model.layers.changeVisibility(d.name);
                    }
                });
                return;
            }
            _.each(curlayers, function (d) {
                if (d.vis) {
                    id.hoot().model.layers.changeVisibility(d.name);
                }
            });
        }
    };

    getBrowserInfo = function(){
        var browserInfo = {};
        var appVerStr = navigator.userAgent;
        var appVer = appVerStr.match(/(chrome|chromium|opera|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
        if(appVer.length > 2){
            browserInfo.name = appVer[1];
            browserInfo.version = appVer[2];     
                 // check detailed version
                 
                 var parts = appVerStr.split(' ');
                 _.each(parts, function(part){
                     if(part.indexOf(browserInfo.name) == 0){
                         var subParts = part.split("/");
                         if(subParts.length > 1){
                            browserInfo.version = subParts[1];
                         }
                     }
                 })
        }
        
        return browserInfo;
        
    };
    
    var bInfo = getBrowserInfo();
    if(bInfo.name !== 'Chrome' && bInfo.name !== 'Chromium'){
        alert("Hootenanny supports only Chrome or Chromium browser! \nHootenanny will not function normally under " + bInfo.name + " v. " + bInfo.version);
    }

    return hoot;
};
