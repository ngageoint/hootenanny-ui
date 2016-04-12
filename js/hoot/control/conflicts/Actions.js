Hoot.control.conflicts.actions = function (context){
    var _instance = {};

    _instance.idgraphsynch = Hoot.control.conflicts.actions.idgraphsynch(context);
    _instance.poimerge = Hoot.control.conflicts.actions.poimerge(context);
    _instance.reviewresolution = Hoot.control.conflicts.actions.reviewresolution(context);
    _instance.traversereview = Hoot.control.conflicts.actions.traversereview(context);
    _instance.sharereview = Hoot.control.conflicts.actions.sharereview(context);

    _instance.reset = function(){
        _instance.idgraphsynch = Hoot.control.conflicts.actions.idgraphsynch(context);
        _instance.poimerge = Hoot.control.conflicts.actions.poimerge(context);
        _instance.reviewresolution = Hoot.control.conflicts.actions.reviewresolution(context);
        _instance.traversereview = Hoot.control.conflicts.actions.traversereview(context);
        _instance.sharereview = Hoot.control.conflicts.actions.sharereview(context);
    }
    return _instance;
}