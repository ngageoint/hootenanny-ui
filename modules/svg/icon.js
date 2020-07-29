export function svgIcon(name, svgklass, useklass) {
    return function drawIcon(selection) {
        var _icon = selection.selectAll('svg.icon')
            .data([0]);
        _icon = _icon.enter()
            .append('svg')
            .merge(_icon)
            .attr('class', 'icon ' + (svgklass || ''));
        var _use = _icon.selectAll('use')
            .data([0]);
        _use.enter()
            .append('use')
            .merge(_use)
            .attr('xlink:href', name)
            .attr('class', useklass);
    };
}
