Hoot.control.validation = function(context, sidebar) {
    var validation = {};

    validation.begin = function(mapid) {
        var container = d3.select('#content')
            .append('div')
            .attr('id', 'validation-container')
            .classed('pin-bottom review-block unclickable', true)
            .append('div')
            .classed('validation col12 fillD pad1 space clickable', true)
            ;

        var meta = container.append('span')
            .classed('_icon info dark pad0y space', true)
            .html(function () {
                return '<strong class="review-note">1 of ' + 'X' + '</strong>';
            });

        var buttons = [
            {
                id: 'verified',
                name: 'foo',
                text: 'Verified',
                color: 'loud',
                icon: '_icon check',
                cmd: iD.ui.cmd('v'),
                action: this.verify
            },
            {
                id: 'next',
                name: 'review_foward',
                text: 'Next',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                input: 'test',
                cmd: iD.ui.cmd('n'),
                action: function() { this.getItem('forward'); }
            },
            {
                id: 'previous',
                name: 'review_backward',
                text: 'Previous',
                color: 'fill-grey button round pad0y pad1x dark small strong',
                cmd: iD.ui.cmd('p'),
                action: function() { this.getItem('backward'); }
            }
        ];

        var opts = container.append('span')
            .classed('fr space', true);
        var optcont = opts.selectAll('a')
            .data(buttons)
            .enter();

        var keybinding = d3.keybinding('validation');
        buttons.forEach(function(d) {
            keybinding.on(d.cmd, function() { d3.event.preventDefault(); d.action(); })
        });

        d3.select(document)
            .call(keybinding);




        context.hoot().control.view.on('layerRemove', function (layerName, isPrimary) {
            console.log('boo');
            d3.select('#validation-container').remove();
        });


        this.getItem(mapid, 'forward');
    };

    validation.getItem = function(mapid, direction) {
        var data = {
            mapId: mapid,
            direction: direction
        };

        Hoot.model.REST('reviewGetNext', data, function (error, response) {
            console.log(response);


        });
    };

    validation.verify = function() {

    };

    return d3.rebind(validation, event, 'on');
}