/**
 *
 */
Hoot.model = function (context){
    var hoot_model = {};

    hoot_model.export = Hoot.model.export(context);
    hoot_model.folders = Hoot.model.folders(context);
    hoot_model.import = Hoot.model.import(context);
    hoot_model.layers = Hoot.model.layers(context);
    hoot_model.conflicts = Hoot.model.conflicts(context);
    hoot_model.conflate = Hoot.model.conflate(context);
    hoot_model.basemapdataset = Hoot.model.basemapdataset(context);

    return hoot_model;
};