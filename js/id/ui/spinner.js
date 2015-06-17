iD.ui.Spinner = function(context) {
    return function(selection) {
        selection.append('img')
            .attr('src', context.imagePath('loader-white.gif'))
            .style('opacity', 0.5);
    };
};
