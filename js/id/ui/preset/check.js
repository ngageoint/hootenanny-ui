iD.ui.preset.check =
iD.ui.preset.defaultcheck = function(field) {
    var event = d3.dispatch('change'),
        options = field.strings && field.strings.options,
        values = [],
        texts = [],
        entity, value, box, text, label;

    if (options) {
        for (var k in options) {
            var indeterminateText = 'undefined';
            if(field.customBoxProp && field.customBoxProp['indeterminate']) {
                indeterminateText = field.customBoxProp['indeterminate'];
            } 
            values.push(k === indeterminateText ? undefined : k);
            texts.push(field.t('options.' + k, { 'default': options[k] }));
        }
    } else {
        values = [undefined, 'yes'];
        texts = [t('inspector.unknown'), t('inspector.check.yes')];
        if (field.type === 'check') {
            values.push('no');
            texts.push(t('inspector.check.no'));
        }
    }

    var check = function(selection) {
        // hack: pretend oneway field is a oneway_yes field
        // where implied oneway tag exists (e.g. `junction=roundabout`) #2220, #1841
        if (field.id === 'oneway') {
            for (var key in entity.tags) {
                if (key in iD.oneWayTags && (entity.tags[key] in iD.oneWayTags[key])) {
                    texts[0] = t('presets.fields.oneway_yes.options.undefined');
                    break;
                }
            }
        }

        selection.classed('checkselect', 'true');

        label = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = label.enter().append('label')
            .attr('class', 'preset-input-wrap');

        enter.append('input')
            .property('indeterminate', field.type === 'check')
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);

       
        enter.append('span')
            .text(texts[0])
            .attr('class', 'value');

        box = label.select('input')
            .on('click', function() {
                if(field.customBoxProp && field.customBoxProp['indeterminate']){
                    if(value == field.customBoxProp['indeterminate']) {
                        value = undefined;
                    }
                }
                var t = {};
                var iVal = (values.indexOf(value) + 1) % values.length;
                t[field.key] = values[iVal];
                
                
                event.change(t);
                d3.event.stopPropagation();
            });

        text = label.select('span.value');
    };

    check.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return check;
    };

    check.tags = function(tags) {
        value = tags[field.key];
        box.property('indeterminate', field.type === 'check' && !value);
        var textval = texts[values.indexOf(value)];
        if(field.customBoxProp && field.customBoxProp['indeterminate']) {
            box.property('indeterminate', field.type === 'check' && (value == field.customBoxProp['indeterminate'] || !value));
            if(!textval){
                textval = field.customBoxProp['indeterminate'];
            }
        }
        
        box.property('checked', value === 'yes');
        text.text(textval);
        label.classed('set', !!value);
        if(field.customBoxProp && field.customBoxProp['checked']) {
            box.property('checked', value == field.customBoxProp['checked']);
            label.classed('set', value == field.customBoxProp['checked']);
        }
        
    };

    check.focus = function() {
        box.node().focus();
    };

    return d3.rebind(check, event, 'on');
};
