// Entity Editor interface. All plugins to entity editor should implement following methods.
iD.ui.plugins.IEntityEditor = {
    getTranslations: function(){},
    requestTranslationToServer: function(reqType, data, respHandler){},
    translateEntity: function(context, entity, currentTranslation, tags, preset, meta, populateBodyCallback){}
}