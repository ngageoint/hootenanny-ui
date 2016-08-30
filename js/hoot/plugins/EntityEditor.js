/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.plugins.entityeditor is for providing TDS preset injection to iD editor entity editor.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.plugins = {};
Hoot.plugins.entityeditor = function() {
    this.allTranslatedFields = null;
    this.allTransTags = null;
    this.defaultTags = null;
    this.defaultRawTags = null;
    this._selectedId = null;

    /**
    * @desc Using the first character in entity id figure out feature type
    * @param entity - Feature entity
    * @return [Point | Area | Line]
    **/
    this.getGeomType = function(entity) {
        var obj = {
            'n': 'node',
            'w': 'way',
            'r': 'relation'
        };
        var char = entity.id.charAt(0);
        var type = obj[char];
        if (type === 'node') {
            return 'Point';
        }
        if (type === 'way') {
            var nodes = entity.nodes;
            var shape = (nodes[0] === nodes[nodes.length - 1]) ? 'Area' : 'Line';
            return shape;
        }
    };

    /**
    * @desc Populate target feature OSM xml in parameter and send request for translation
    * @param entity - Feature entity
    * @param transType - Translation type i.e. TDSv40
    * @param meta - Filter meta data
    * @param callback
    **/
    this.getLTDSTags =function (entity, transType, meta, callback) {

        var geom = this.getGeomType(entity);
        var filterType = transType;

        var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'hootenanny\'>' + JXON.stringify(entity.asJXON()) + '</osm>';
        var data = {};

        data.osmXml = osmXml;
        data.translation = filterType;
        data.geom = geom;
        data.filterMeta = meta;
        this.requestTranslationToServer('LTDS', data, callback);
    };


    /**
    * @desc Translate TDS to OSM
    * @param entity - Feature entity
    * @param transType - Translation type i.e. TDSv40
    * @param callback
    **/
    this.getOSMTags =function(entity, transType, callback) {

        var filterType = transType;
        var osmXml = '<osm version=\'0.6\' upload=\'true\' generator=\'hootenanny\'>' + JXON.stringify(entity.asJXON()) + '</osm>';
        var data = {};

        data.translation = filterType;
        data.osmXml = osmXml;
        this.requestTranslationToServer('TDSToOSM', data, callback);
    };



    // When coming from rest end point, tags keys are descriptions.
    // Since iD preset uses name instead of description modify the keys
    // with name. (Which should be unique)
    // rawCurFields contains field description and we need it to get
    // each fields description and name which are used to modify the tag keys.
    this.modifyRawTagKeysDescToName = function(id, rawCurFields, rawTags){
        var me = this;
        var modTags = {};
        me.allTransTags = {};



        /*if(!me._selectedId || me._selectedId !== id){
            me.defaultTags = {};
            me.defaultRawTags = {};
            me._selectedId = id;

        }*/

        me.defaultTags = {};
        me.defaultRawTags = {};
        me._selectedId = id;

         _.each(rawCurFields, function(f){
             var val = rawTags[f.desc];
             if(val) {
                if(!Hoot.plugins.entityeditor.noShowDefs[val]){
                    modTags[f.name] = val;
                    me.defaultTags[f.name] = val;
                    me.defaultRawTags[f.name] = val;
                } else {
                    if(me.defaultTags[f.name] !== undefined){
                        me.defaultTags[f.name] = val;
                    }

                    if(me.defaultRawTags[f.name] !== undefined){
                        me.defaultRawTags[f.name] = val;
                    }
                }

             }
            me.allTransTags[f.name] = val;
         });

         return modTags;
    };

    /**
    * @desc Create internal preset object
    * @param geom - Feature geom type
    * @param ftype - Feature type
    * @param trans - Translation type i.e. TDSv40
    * @param fcode
    **/
    this.createPreset = function( geom, ftype, trans, fcode) {
        // create new preset
        var newPreset = {};
        //newPreset.icon = 'highway-road';
        newPreset.geometry = geom;
        newPreset.tags = {};
        newPreset['hoot:featuretype'] = ftype;
        newPreset['hoot:transtype'] = trans;
        newPreset['hoot:fcode'] = fcode;
        newPreset.name = ftype + ' (' + fcode + ')';
        return newPreset;

    };

    /**
    * @desc Create internal preset object
    * @param geom - Feature geom type
    * @param ftype - Feature type
    * @param trans - Translation type i.e. TDSv40
    * @param name - Feature name
    **/
    this.createPresetByName = function( geom, ftype, trans, name) {
        // create new preset
        var newPreset = {};
        //newPreset.icon = 'highway-road';
        newPreset.geometry = geom;
        newPreset.tags = {};
        newPreset['hoot:featuretype'] = ftype;
        newPreset['hoot:transtype'] = trans;
        newPreset['hoot:name'] = name;
        newPreset.name = ftype + ' (' + name + ')';
        return newPreset;

    };

    /**
    * @desc Create feature tag fields
    * @param fieldInfo - Fields meta data
    **/
    this.createField = function(fieldInfo) {
        var newField = {};
        newField.key = fieldInfo.name;
        newField.label = fieldInfo.desc;
        newField.placeholder = fieldInfo.defValue;
        if(fieldInfo.type === 'String') {
            newField.type = 'text';//rawCurField.type do some manipulation from raw to preset field
        } else if(fieldInfo.type === 'enumeration') {
           var found =  _.find(fieldInfo.enumerations, function(e){
                return (e.value === '1000' && e.name === 'False');
            });

            // it is boolean selector
            if(found){
                newField.type = 'check';
                newField.strings = {};
                newField.strings.options = {};

                // for checkbox order of key is important so order No Information, True, False
                newField.strings.options['No Information'] = 'No Information';
                newField.strings.options.True = 'True';
                newField.strings.options.False = 'False';
            } else {
                newField.type = 'combo';
                newField.strings = {};
                newField.strings.options = {};
                _.each(fieldInfo.enumerations, function(e){
                    newField.strings.options[e.name] = e.name;
                });
            }
        } else {
            newField.type = 'number';
        }
        return newField;
    };

    this.mapTags = function(tags, fields) {
        return _.map(tags, function (d, e) {

            var obj = {};
            obj.key = e;
            obj.value = d;

            if(fields){
                var col = _.find(fields, function(item){
                    return item.desc === e;
                });
                obj.field = col;
            }

            return obj;
        });
    };

};



/**
* @desc Map of tag values which should be hidden
**/
Hoot.plugins.entityeditor.noShowDefs = {'-999999.0':'-999999.0', 'No Information':'No Information',
                'noInformation':'noInformation', '-999999':'-999999',
                'Closed Interval': 'Closed Interval'};

Hoot.plugins.entityeditor.prototype = Object.create(iD.ui.plugins.IEntityEditor);

/*
[{'name':'OSM'},
                {'name':'TDSv61'},
                {'name':'TDSv40'},
                {'name':'HGISv20',
                 'meta':{'filtertagname':'name', 'filterkey':'HGIS_Layer'}}];*/
Hoot.plugins.entityeditor.prototype.getTranslations = function(){

    var trans = [];
    _.forEach(iD.data.hootConfig.translationCapabilites, function(v,k){
        var pair = {};
        pair.name = k;
        if(v.meta){
            pair.meta = v.meta;
        }
        trans.push(pair);
    });

    return trans;
};




// Dependent on hoot function call. Override if needed in other platform
Hoot.plugins.entityeditor.prototype.requestTranslationToServer = function(reqType, data, respHandler) {
    Hoot.model.REST(reqType, data, function (resp) {
        if(resp.error){
            iD.ui.Alert('Failed to retrieve translation: ' + resp.error,'error',new Error().stack);
            return;
        }
        if (respHandler) {
            respHandler(resp);
        }
    });
};

/**
* @desc Translate entity tags to requested translation type
* @param context - Hootenanny global context
* @param entity - Target entity
* @param currentTranslation - Target translation
* @param tags - new tags
* @param preset - new preset
* @param meta - new meta
* @param populateBodyCallback - callback
**/
Hoot.plugins.entityeditor.prototype.translateEntity = function(context, entity, currentTranslation,
        tags, preset, meta, populateBodyCallback){
    var me = this;
    this.getLTDSTags(entity, currentTranslation, meta, function(resp){
        // Search fields and presets and if does not exist then add
        var transInfo = {};
        var curGeom = context.geometry(entity.id);

        // sometimes we do not get feature code. Like where core could not find translation..
        var rawFCode = resp.attrs['Feature Code'];
        var curPreset = preset;
        if(rawFCode) {
            var fCode = rawFCode.split(':')[0].trim();
            var fType = rawFCode.split(':')[1].trim();
            curPreset = _.find(context.presets().collection, function(item){return item.id === currentTranslation + '/' + fCode;});

            var rawCurFields = JSON.parse(resp.fields).columns;

            me.modifyRawTagKeysDescToName(entity.id, rawCurFields, resp.attrs);

            if(!curPreset){

                // create preset from fcode of entity
                var newPreset = me.createPreset(curGeom, fType, currentTranslation, fCode);
                curPreset = context.presets().addPreset(currentTranslation + '/' + fCode, newPreset);

                curPreset.fields = [];
                me.allTranslatedFields = [];
                _.each(rawCurFields, function(f){
                    // create field using field data from service
                    var newField = me.createField(f);

                    // add to global list of preset fields
                    context.presets().addField(currentTranslation + '/' + f.name, newField);

                    // create field tob added to inspector preset
                    var fieldObj = context.presets().field(currentTranslation + '/' + f.name, newField);

                    // create new field for label. This is hack to by-pass the iD's language support t()
                    // where it generates localized langugage for the label.
                    // Since we are creating the label from the description from translation server there
                    // is no way to translate English to local language at runtime. We will stick with English
                    // for translated preset.
                    fieldObj.rawLabel = f.desc;
                    fieldObj.label = function() {
                        return this.rawLabel;
                    };

                    // custom override for indeterminate and checked value for check box
                    if(fieldObj.type === 'check') {
                        fieldObj.customBoxProp = {};
                        fieldObj.customBoxProp.indeterminate = 'No Information';
                        fieldObj.customBoxProp.checked = 'True';
                    }

                    // for now we initially hide fields but iD will show populated fields
                       fieldObj.show = 'false';
                    curPreset.fields.push(fieldObj);
                    me.allTranslatedFields.push(fieldObj);

                });
            }
            transInfo.transType = currentTranslation;
            transInfo.fCode = fCode;
        } else {
            var lyrName = resp.attrs.HGIS_Layer;
            fType = resp.attrs.TYPE1;

            // handle HGIS translation
            if(lyrName && fType) {
                rawCurFields = JSON.parse(resp.fields).columns;
                me.modifyRawTagKeysDescToName(entity.id, rawCurFields, resp.attrs);

                newPreset = me.createPresetByName(curGeom, fType, currentTranslation, lyrName);

                curPreset = context.presets().addPreset(currentTranslation + '/' + fCode, newPreset);

                curPreset.fields = [];
                me.allTranslatedFields = [];
                _.each(rawCurFields, function(f){
                    // create field using field data from service
                    var newField = me.createField(f);

                    // add to global list of preset fields
                    context.presets().addField(currentTranslation + '/' + f.name, newField);

                    // create field tob added to inspector preset
                    var fieldObj = context.presets().field(currentTranslation + '/' + f.name, newField);

                    // create new field for label. This is hack to by-pass the iD's language support t()
                    // where it generates localized langugage for the label.
                    // Since we are creating the label from the description from translation server there
                    // is no way to translate English to local language at runtime. We will stick with English
                    // for translated preset.
                    fieldObj.rawLabel = f.desc;
                    fieldObj.label = function() {
                        return this.rawLabel;
                    };

                    // custom override for indeterminate and checked value for check box
                    if(fieldObj.type === 'check') {
                        fieldObj.customBoxProp = {};
                        fieldObj.customBoxProp.indeterminate = 'No Information';
                        fieldObj.customBoxProp.checked = 'True';
                    }

                    // for now we initially hide fields but iD will show populated fields
                    fieldObj.show = 'false';
                    curPreset.fields.push(fieldObj);
                    me.allTranslatedFields.push(fieldObj);

                });
                transInfo.transType = currentTranslation;
                transInfo.name = name;
            } else {
                // Don't know what to do so empty it out
                me.defaultTags = {};
                me.defaultRawTags = {};
                transInfo = {};
                me.allTranslatedFields = {};
                me.allTransTags = {};
            }


        }

        // create entity editor body
        populateBodyCallback(curPreset, me.defaultTags, me.defaultRawTags, transInfo, me.allTranslatedFields, me.allTransTags);
    });

};


/**
* @desc Update entity editor tag when selected preset changes
* @param entity - Target entity
* @param changed - new tag
* @param rawTagEditor - Raw tag editor object
* @param currentTranslation - Translation to use for update
* @param callback - callback
**/
Hoot.plugins.entityeditor.prototype.updateEntityEditor = function(resolver, entity, changed, rawTagEditor,
    currentTranslation, callback) {

    var currentTags = entity.tags;
    var me = this;
    var changeKey = _.keys(changed)[0];
    var changeVal = _.values(changed)[0];

    // Sometimes we get undefined change key (i.e. during delete)
    // Then search for the second populated key value set and apply change.
    if(!changeKey){
        changeKey = _.keys(changed)[1];
        changeVal = _.values(changed)[1];
    }



    var rawTags = rawTagEditor.tags();


    // no chnage made. This can happen when raw_tag_editor calls change event from
    // field blur.
    if(changeVal !== undefined && rawTags[changeKey] === changeVal)
    {
        return;
    }
    var isDelete = false;
    // If changeVal is undefined then we are deleting it.
    if(changeVal === undefined){
       var foundF = _.find(me.allTranslatedFields, function(f){
            return f.key === changeKey;
        });

       if(foundF && foundF.type === 'number') {
               changeVal = '-999999.0';
       } else {
               changeVal = 'No Information';
       }
       me.defaultTags[changeKey] = changeVal;
       me.defaultRawTags[changeKey] = changeVal;
       isDelete = true;
    }

    // apply the change to local store of raw tags to be saved later
    rawTags[changeKey] = changeVal;

    // Get the clone of entity
    var tmpEntity = entity.copy(resolver, []);


    // Go through each tags and create new tags list of key as English tag
    // and apply modified value. If there is no modified value then apply
    // the default value.
    // We do this since translation server takes english tags rather then the
    // raw tag key.
    var englishTags = {};
    _.each(me.allTranslatedFields, function(f){

        var k = f.key;
        var v = rawTags[k];
        if(v !== undefined && v !== null) {
            englishTags[f.rawLabel] = v;
        } else {
            // Set default value
            englishTags[f.rawLabel] = me.allTransTags[k];
        }

    });

    //var pRawTagEditor = rawTagEditor;
    // Translate the TDS tags to OSM so we can store it in iD internal
    tmpEntity.tags = englishTags;
    this.getOSMTags(tmpEntity, currentTranslation, function (d) {
        if (d.attrs) {
            var OSMTagsAr = me.mapTags(d.attrs);
            var OSMEntities = {};
            _.forEach(OSMTagsAr, function(tagElem){
                OSMEntities[tagElem.key] = tagElem.value;
            });

            // for each of default tags (The ones that will come from default.json in the future)

            for(var key in me.allTransTags) {
                if(!OSMEntities[key] && key === changeKey) {
                    for(var tk in currentTags){
                        if(!OSMEntities[tk]){
                            OSMEntities[tk] = undefined;
                        }
                    }
                    if(isDelete === true){

                        delete me.defaultRawTags[key];
                    } else {
                        me.defaultRawTags[key] = changeVal;
                    }
                    //
                    me.defaultTags[key] = changeVal;

                }
            }
            if(callback){
                callback(OSMEntities);
            }

        }

    });
};