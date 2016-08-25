/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// window.Hoot
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//      14 Apr. 2016: Updates made for eslint -- Sisskind
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
window.Hoot = {};
//var k;
Hoot.hoot = function (context) {
    var mode,
        hoot = {};
        //layers = {},
        //availLayers = [];

    hoot.ui = Hoot.ui(context);
    hoot.model = Hoot.model(context);
    hoot.view = Hoot.view(context);
    hoot.control = Hoot.control(context);
    hoot.zoom = iD.data.hootConfig.hootMapInitialZoom;
    //Generate random starting location
    var random = Math.floor((Math.random() * 7) + 1); //gives number between 1 and 7
    if (random === 1){
        hoot.center = iD.data.hootConfig.hootMapInitialCenter1;
    } else if (random === 2) {
        hoot.center = iD.data.hootConfig.hootMapInitialCenter2;
    } else if (random === 3) {
        hoot.center = iD.data.hootConfig.hootMapInitialCenter3;
    } else if (random === 4) {
        hoot.center = iD.data.hootConfig.hootMapInitialCenter4;
    } else if (random === 5) {
        hoot.center = iD.data.hootConfig.hootMapInitialCenter5;
    } else if (random === 6) {
        hoot.center = iD.data.hootConfig.hootMapInitialCenter6;
    } else if (random === 7) {
        hoot.center = iD.data.hootConfig.hootMapInitialCenter7;
    }

    //hoot.center = iD.data.hootConfig.hootMapInitialCenter;
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

    /**
    * @desc This function is invoke from iD.data.load in index.html during
    *       application initialization and performs Hootenanny specific initialization
    * @param callback
    **/
    hoot.load = function (callback) {

        hoot.model.folders.refresh(function () {
            hoot.model.layers.refresh(function(){
                hoot.model.folders.refreshLinks(function(){
                    if (callback) {
                        callback();
                    }
                });
            });
            /*if (callback) {
                callback();
            }*/
        });
        Hoot.model.REST('GetTranslationServerStatus', function(){
            Hoot.model.REST('getTransaltionCapabilities', function (error, resp) {
                if(error){
                    alert('Failed to retrieve translation capabilities: ' + error);
                    return;
                }
                iD.data.hootConfig.translationCapabilites = JSON.parse(resp.responseText);

                // we do this to make sure OSM is in list and not duplicate
                // which can happen if it is included in the list from server
                iD.data.hootConfig.translationCapabilites.OSM = {'isvailable':'true'};
            });

        });

        Hoot.model.REST('getConflationCustomOpts',function(){});



        Hoot.model.REST('getMapSizeThresholds', function (thresholds) {
            if(thresholds.error){
                return;
            }
            iD.data.hootConfig.export_size_threshold = 1*thresholds.export_threshold;
            iD.data.hootConfig.ingest_size_threshold = 1*thresholds.ingest_threshold;
            iD.data.hootConfig.conflate_size_threshold = 1*thresholds.conflate_threshold;
        });

        hoot.getAllusers();

    };

    /**
    * @desc Retrieves users list from server
    * @param callback - callback
    **/
    hoot.getAllusers = function(callback) {
        Hoot.model.REST('getAllUsers', function (resp) {
            if(resp.error){
                alert('Failed to retrieve users: ' + resp.error);
                return;
            }

            iD.data.hootConfig.users = {};
            _.each(resp.users, function(r){
                iD.data.hootConfig.users[1*r.id] = r;
            });

            iD.data.hootConfig.usersRaw = resp.users;
            if(callback) {
                callback(resp.users);
            }

        });

    };

    /**
    * @desc Returns availabe symbology palette
    * @param co - filter object
    **/
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


    /**
    * @desc Changes layer features to selected color
    * @param lyrid - target layer id
    * @param color - selected color
    **/
    hoot.changeColor = function (lyrid, color) {
        var modifiedId = lyrid.toString();
        var sheets = document.styleSheets[document.styleSheets.length - 1];
        color = hoot
            .palette(color);
        var lighter = d3.rgb(color)
            .brighter();
        sheets.insertRule('path.stroke.tag-hoot-' + modifiedId + ' { stroke:' + color + '}', sheets.cssRules.length - 1);
        sheets.insertRule('path.shadow.tag-hoot-' + modifiedId + ' { stroke:' + lighter + '}', sheets.cssRules.length - 1);
        sheets.insertRule('path.fill.tag-hoot-' + modifiedId + ' { fill:' + lighter + '}', sheets.cssRules.length - 1);
        sheets.insertRule('g.point.tag-hoot-' + modifiedId + ' .stroke { fill:' + color + '}', sheets.cssRules.length - 1);
    };

    /**
    * @desc Removes layer color
    * @param lyrid - target layer id
    **/
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


    /**
    * @desc Switches the feature color of a layer
    * @param name - target layer id
    * @param color - new color
    **/
    hoot.replaceColor = function (name, color) {
        hoot.removeColor(name);
        hoot.changeColor(name, color);
    };

    var _findLayerStyleRules = function(lyrid) {

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


    /**
    * @desc Toggles between current layer color and osm symbology
    * @param name - target layer name
    **/
    hoot.toggleColor = function(name){
        //get layer id
        var lyrid = hoot.model.layers.getmapIdByName(name);
        //find style
        var rules = _findLayerStyleRules(lyrid);
        // if not exist then put by looking into layers
        if(rules.length === 0){
            var lyr = hoot.model.layers.layers[name];
            if(lyr){
                hoot.changeColor(lyrid, lyr.color);
            }
        } else {// else remove which reveals osm symbology
            hoot.removeColor(lyrid);
        }

    };

    // Appears to be dead code and after verification should be deprecated.
    hoot.autotune = function (type, data, callback) {
        Hoot.model.REST(type, data, function (res) {
            if (callback) {
                callback(res);
            }
        });
    };


    /**
    * @desc Instantiate classes in Manage tab
    **/
    hoot.loadUtilities = function () {
     /*   if(!hoot.utilities){
            hoot.utilities = Hoot.Utilities(context);
        }*/

        hoot.view.utilities.activate();
        Hoot.control.TranslationAssistant(context);
    };

    /**
    * @desc checks to see if in review mode
    **/
    hoot.checkReviewMode = function() {
        return !(d3.select('#conflicts-container').empty());
    };

    /**
    * @desc Check for valid coordinate pair
    * @param Coordinate pair [x,y]
    **/
    hoot.checkForValidCoordinates = function(coord){
        try{
            if(coord.length !==2) {return false;}
            if(isNaN(coord[0])) {return false;}
            if(isNaN(coord[1])) {return false;}

            if(coord[0] > 180.0 || coord[0] < -180.0) {return false;}
            if(coord[1] > 90.0 || coord[1] < -90.0) {return false;}

            return true;
        } catch (err) { return false; }
    };


    hoot.checkForSpecialChar = function(str){
        var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?|]/);  //"
        if (pattern.test(str)) {
            return false;
        }
        return true;
   };

   /**
    * @desc Special character validation helper function
    * @param str - target string
    **/
    hoot.checkForUnallowableWords = function(str){
        var unallowable = ['root','dataset','datasets','folder'];
        if(unallowable.indexOf(str.toLowerCase())>=0){return false;}
        return true;
   };

   hoot.checkForUnallowedChar = function(str){
    if(!hoot.checkForSpecialChar(str)){
        return 'Please do not use special characters: ' + str + '.';
    }
       if(!hoot.checkForUnallowableWords(str)){
        return 'Please do not use any unallowable terms: ' + str + '.';
    }
    return true;
   };

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

    d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

    /**
    * @desc Hotkey for swapping layers
    * @param event - key stroke event
    **/
    document.onkeydown = function (event) {
        if (event.altKey && (event.which === 66)) {
            context.hoot().model.layers.layerSwap();
        } else if (event.altKey && (event.which === 78)) {
            var curlayers = context.hoot().model.layers.getLayers();
            var vis = _.filter(curlayers, function (d) {
                return d.vis;
            }).length;
            if (vis === 0) {
                _.each(curlayers, function (d) {
                    if (d.loadable) {
                        context.hoot().model.layers.changeVisibility(d.name);
                    }
                });
                return;
            }
            _.each(curlayers, function (d) {
                if (d.vis) {
                    context.hoot().model.layers.changeVisibility(d.name);
                }
            });
        }
    };

    hoot.assert = function(condition)
    {
        if (!condition){
            throw new Error('Assertion failed');
        }
    };

    hoot.containsObj = function(obj, arr)
    {
      for (var i = 0; i < arr.length; i++)
      {
        if (arr[i] === obj)
        {
          return true;
        }
      }
      return false;
    };

    /**
    * @desc Returns browser information.
    **/
    hoot.getBrowserInfo = function(){
        var browserInfo = {};
        var appVerStr = navigator.userAgent;
        var appVer = appVerStr.match(/(chrome|chromium|opera|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(appVer.length > 2){
            browserInfo.name = appVer[1];
            browserInfo.version = appVer[2];
                 // check detailed version

                 var parts = appVerStr.split(' ');
                 _.each(parts, function(part){
                     if(part.indexOf(browserInfo.name) === 0){
                         var subParts = part.split('/');
                         if(subParts.length > 1){
                            browserInfo.version = subParts[1];
                         }
                     }
                 });
        }

        return browserInfo;

    };

    var bInfo = hoot.getBrowserInfo();
    if(bInfo.name !== 'Chrome' && bInfo.name !== 'Chromium' && bInfo.name !== 'Firefox'){
        alert('Hootenanny will not function normally under ' + bInfo.name + ' v. ' + bInfo.version);
    }

    return hoot;
};
