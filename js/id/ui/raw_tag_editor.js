iD.ui.RawTagEditor = function(context) {
    var event = d3.dispatch('change'),
        showBlank = false,
        state,
        preset,
        tags,
        id,
        translation,
        tagInfEndPts;

    function rawTagEditor(selection) {
        var count = Object.keys(tags).filter(function(d) { return d; }).length;

        selection.call(iD.ui.Disclosure()
            .title(t('inspector.all_tags') + ' (' + count + ')')
            .expanded(context.storage('raw_tag_editor.expanded') === 'true' || preset.isFallback())
            .on('toggled', toggled)
            .content(content));

        function toggled(expanded) {
            context.storage('raw_tag_editor.expanded', expanded);
            if (expanded) {
                selection.node().parentNode.scrollTop += 200;
            }
        }
    }

    function content($wrap,sortAZ) {
        var entries = d3.entries(tags);
        if(sortAZ === undefined||null){
            if(!d3.select('#sort-tags').empty()){sortAZ = d3.select('#sort-tags').property('checked');}
            else{sortAZ=false;}
        }
        if(sortAZ){
            entries.sort(function(a,b){var textA = a.key.toUpperCase();
                var textB = b.key.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
        }

        if (!entries.length || showBlank) {
            showBlank = false;
            entries.push({key: '', value: ''});
        }

        var $selectAll = $wrap.selectAll('.select-all-button').data([0]);

        $selectAll.enter().append('button')
            .attr('tabindex', -1)
            .classed('select-all-button',true)
            .on('click',function(){
                d3.event.stopPropagation();
                d3.event.preventDefault();

                var buttons = d3.selectAll('.tag-row .tag-reference-button svg');

                // Determine if we are selecting all or unselecting all
                if(buttons[0].length === d3.selectAll('.tag-row .tag-reference-button svg.light')[0].length){
                    buttons.classed('light',false);
                } else {
                    buttons.classed('light',true);
                }

                var seltags = d3.selectAll('li.tag-row').filter(function() {
                    return d3.select(this).selectAll('svg.icon.checked:not(.light)').size() === 1;
                }).data().reduce(function(m, d) {
                    m[d.key] = d.value;
                    return m;
                }, {});

                context.copyTags(seltags);
            })
            .call(iD.svg.Icon('#icon-apply'));


        var $list = $wrap.selectAll('.tag-list')
            .data([0]);

        $list.enter().append('ul')
            .attr('class', 'tag-list');

        var $newTag = $wrap.selectAll('.add-tag')
            .data([0]);

        var $enter = $newTag.enter()
            .append('button')
            .attr('class', 'add-tag')
            .call(iD.svg.Icon('#icon-plus', 'light'));

        $enter.append('span')
            .attr('class', 'icon plus light');

       var $sortAZ = $newTag.enter().append('div')
            .classed('contain', true)
            .attr('id','sort-tags-div')
            .style('position','absolute').style('right','25px').style('margin','-25px 0')
            .html(function(){
                var retval = '<label class="pad1x" style="opacity: 1;">';
                retval += '<input type="checkbox" class="reset" id="sort-tags" ';
                retval += 'style="opacity: 1;"';
                retval += '>Sort A-Z</label>';
                return retval;
            });

      /* if(d3.select('#entity_editor_presettranstype').value()=='OSM'){
           d3.select('#sort-tags-div').classed('hidden',false);
       } else {d3.select('#sort-tags-div').classed('hidden',true);}*/

       $sortAZ.on('change',function(){
            var sortAZ = d3.select('#sort-tags').property('checked');
            if(sortAZ === true){
                content($wrap,true);
            } else {
                content($wrap);
            }
        });

        $enter.on('click', addTag);

        var $items = $list.selectAll('li')
            .data(entries, function(d) { return d.key; });

        var protectedKeys = ['hoot','uuid'];

        // Enter

        $enter = $items.enter().append('li')
            .attr('class', 'tag-row cf');

        $enter.append('div')
            .attr('class', 'key-wrap')
            .append('input')
            .property('type', 'text')
            .attr('class', 'key')
            .attr('maxlength', 255);

        $enter.append('div')
            .attr('class', 'input-wrap-position')
            .append('input')
            .property('type', 'text')
            .attr('class', 'value')
            .attr('maxlength', 255);

        $enter.append('button')
            .attr('tabindex', -1)
            .attr('class', 'remove minor')
            .call(iD.svg.Icon('#operation-delete'));

        if (context.taginfo()) {
            $enter.each(bindTypeahead);
        }

        // Update

        //removed to allow for A-Z sorting
        //if(!translation) {
            $items.order();
        //}
        $items.on('click', function() {

        });

        // $items.each(function(tag) {
        //     var reference = iD.ui.TagReference({key: tag.key}, context);

        //     if (state === 'hover') {
        //         reference.showing(false);
        //     }

        //     d3.select(this)
        //         .call(reference.button)
        //         .call(reference.body);
        // });

        $items.each(function(tag) {
            var copier = iD.ui.TagCopy({key: tag.key}, context);

            d3.select(this)
                .call(copier.button)
                .call(copier.body);
        });

        $items.select('input.key')
            .value(function(d) { return d.key; })
            .on('blur', keyChange)
            .on('change', keyChange);

        $items.select('input.value')
            .value(function(d) { return d.value; })
            .on('blur', valueChange)
            .on('change', valueChange)
            .on('keydown.push-more', pushMore)
            .each(function(d){
                if(!_.isEmpty(_.filter(protectedKeys,function(item){return d.key.indexOf(item) === 0;}))){
                    d3.select(this).attr('readonly',true);
                }
            });


        $items.select('button.remove')
            .on('click', function(d){
                if(!_.isEmpty(_.filter(protectedKeys,function(item){return d.key.indexOf(item) === 0;}))){
                    return iD.ui.Alert('Cannot remove a protected tag!','warning',new Error().stack);
                } else {
                    return removeTag(d);
                }
            });

        $items.exit()
            .each(unbind) //iD v1.9.3
            .remove();

        function pushMore() {
            if (d3.event.keyCode === 9 && !d3.event.shiftKey &&
                $list.selectAll('li:last-child input.value').node() === this) {
                addTag();
            }
        }

        function bindTypeahead() {
            var row = d3.select(this),
                key = row.selectAll('input.key'),
                value = row.selectAll('input.value');

            function sort(value, data) {
                var sameletter = [],
                    other = [];
                data.sort(function(a,b){var textA = a.value.toUpperCase();
                    var textB = b.value.toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });
                for (var i = 0; i < data.length; i++) {
                    if (data[i].value.substring(0, value.length) === value) {
                        sameletter.push(data[i]);
                    } else {
                        other.push(data[i]);
                    }
                }
                return sameletter.concat(other);
            }

            key.call(d3.combobox()
                .fetcher(function(value, callback) {
                    var tagInfoOpts = {
                        debounce: true,
                        geometry: context.geometry(id),
                        query: value
                    };
                    var origTagInfoEndPt = context.taginfo().endpoint();
                    // passing optional translation info
                    if(translation){
                        // Refactor out the fCode
                        if(translation.fCode){
                            tagInfoOpts.fcode = translation.fCode;
                        } /*else {
                            tagInfoOpts.lyrname = translation.name;
                        }*/

                        tagInfoOpts.translation = translation.transType;
                        var rawGeom = context.geometry(id);
                        if(rawGeom === 'point'){
                            rawGeom = 'Point';
                        } else if(rawGeom === 'line'){
                            rawGeom = 'Line';
                        } else if(rawGeom === 'area'){
                            rawGeom = 'Area';
                        }
                        var transTagInfoUrl = window.location.protocol + '//' +
                            window.location.hostname +
                            Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
                            '/taginfo/';

                        if(!tagInfEndPts){
                            tagInfEndPts = {};
                            tagInfEndPts.OSM = origTagInfoEndPt;
                            tagInfEndPts.translation = transTagInfoUrl;
                        } else {
                            transTagInfoUrl = tagInfEndPts.translation;
                        }
                        tagInfoOpts.rawgeom = rawGeom;
                        context.taginfo().endpoint(transTagInfoUrl);

                    } else {
                        if(tagInfEndPts){
                            var osmTagInfoUrl = tagInfEndPts.OSM;
                            context.taginfo().endpoint(osmTagInfoUrl);
                        }

                    }

                    context.taginfo().keys(tagInfoOpts, function(err, data) {
                        if (!err) callback(sort(value, data));
                    });
                }));

            value.call(d3.combobox()
                .fetcher(function(value, callback) {
                    var tagInfoOpts = {
                        debounce: true,
                        key: key.value(),
                        geometry: context.geometry(id),
                        query: value
                    };
                    var origTagInfoEndPt = context.taginfo().endpoint();
                    // passing optional translation info
                    if(translation){
                        tagInfoOpts.fcode = translation.fCode;
                        tagInfoOpts.translation = translation.transType;
                        context.taginfo().endpoint(window.location.protocol + '//' +
                            window.location.hostname +
                            Hoot.model.REST.formatNodeJsPortOrPath(iD.data.hootConfig.translationServerPort) +
                            '/taginfo/');
                    }
                    context.taginfo().values(tagInfoOpts, function(err, data) {
                        if (!err) callback(sort(value, data));
                        context.taginfo().endpoint(origTagInfoEndPt);
                    });
                }));
        }

        //iD v1.9.3
        function unbind() {
            var row = d3.select(this);

            row.selectAll('input.key')
                .call(d3.combobox.off);

            row.selectAll('input.value')
                .call(d3.combobox.off);
        }

        function keyChange(d) {
            var kOld = d.key,
                kNew = this.value.trim(),
                tag = {};

            if (kNew && kNew !== kOld) {
                var match = kNew.match(/^(.*?)(?:_(\d+))?$/),
                    base = match[1],
                    suffix = +(match[2] || 1);
                while (tags[kNew]) {  // rename key if already in use
                    kNew = base + '_' + suffix++;
                }
            }
            tag[kOld] = undefined;
            tag[kNew] = d.value;
            d.key = kNew; // Maintain DOM identity through the subsequent update.
            this.value = kNew;
            event.change(tag);
        }


        function valueChange(d) {
            var tag = {};
            tag[d.key] = this.value;
            event.change(tag);
        }

        function removeTag(d) {
            var tag = {};
            tag[d.key] = undefined;
            event.change(tag);
            d3.select(this.parentNode).remove();
        }

        function addTag() {
            // Wrapped in a setTimeout in case it's being called from a blur
            // handler. Without the setTimeout, the call to `content` would
            // wipe out the pending value change.
            setTimeout(function() {
                showBlank = true;
                content($wrap);
                $list.selectAll('li:last-child input.key').node().focus();
            }, 0);
        }
    }

    rawTagEditor.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return rawTagEditor;
    };

    rawTagEditor.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return rawTagEditor;
    };

    rawTagEditor.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        return rawTagEditor;
    };

    rawTagEditor.entityID = function(_) {
        if (!arguments.length) return id;
        id = _;
        return rawTagEditor;
    };

    rawTagEditor.entityTranslation = function(_) {
        if (!arguments.length) return translation;
        translation = _;
        return rawTagEditor;
    };

    return d3.rebind(rawTagEditor, event, 'on');
};
