/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hoot.view intantiates Manage related classes.
//
// NOTE: Please add to this section with any modification/addtion/deletion to the behavior
// Modifications:
//      03 Feb. 2016
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
Hoot.view = function (context){
    var hoot_view = {};

    hoot_view.utilities = Hoot.view.utilities(context);
    hoot_view.ltdstags = Hoot.view.ltdstags(context);
    hoot_view.versioninfo = Hoot.view.versioninfo(context);

    return hoot_view;
};