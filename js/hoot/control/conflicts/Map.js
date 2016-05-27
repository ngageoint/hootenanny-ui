Hoot.control.conflicts.map = function (context){
    var _instance = {};

    _instance.featurehighlighter = Hoot.control.conflicts.map.featurehighlighter(context);
    _instance.featureNavigator = Hoot.control.conflicts.map.featureNavigator(context);
    _instance.reviewarrowrenderer = Hoot.control.conflicts.map.reviewarrowrenderer(context);

    _instance.reset = function(){
        _instance.idgraphsynch = Hoot.control.conflicts.actions.idgraphsynch(context);
        _instance.poimerge = Hoot.control.conflicts.actions.poimerge(context);
        _instance.reviewresolution = Hoot.control.conflicts.actions.reviewresolution(context);
        _instance.traversereview = Hoot.control.conflicts.actions.traversereview(context);
    };
    return _instance;
};