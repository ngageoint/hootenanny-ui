iD.svg.TagClasses = function(context) {
    var primaries = [
            'building', 'highway', 'railway', 'waterway', 'aeroway',
            'motorway', 'boundary', 'power', 'amenity', 'natural', 'landuse',
            'leisure', 'place'
        ],
        statuses = [
            'proposed', 'construction', 'disused', 'abandoned', 'dismantled',
            'razed', 'demolished', 'obliterated'
        ],
        secondaries = [
            'oneway', 'bridge', 'tunnel', 'embankment', 'cutting', 'barrier',
            'surface', 'tracktype', 'crossing'
        ],
        tagClassRe = /^tag-/,
        tags = function(entity) { return entity.tags; };


    var tagClasses = function(selection) {
        selection.each(function tagClassesEach(entity) {
            var value = this.className,
                classes, primary, status;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            }).join(' ');

            var t = tags(entity), i, k, v;

            // pick at most one primary classification tag..
            for (i = 0; i < primaries.length; i++) {
                k = primaries[i];
                v = t[k];
                if (!v || v === 'no') continue;

                primary = k;
                if (statuses.indexOf(v) !== -1) {   // e.g. `railway=abandoned`
                    status = v;
                    classes += ' tag-' + k;
                } else {
                    classes += ' tag-' + k + ' tag-' + k + '-' + v;
                }

                break;
            }

            // add at most one status tag, only if relates to primary tag..
            if (!status) {
                for (i = 0; i < statuses.length; i++) {
                    k = statuses[i];
                    v = t[k];
                    if (!v || v === 'no') continue;

                    if (v === 'yes') {   // e.g. `railway=rail + abandoned=yes`
                        status = k;
                    }
                    else if (primary && primary === v) {  // e.g. `railway=rail + abandoned=railway`
                        status = k;
                    } else if (!primary && primaries.indexOf(v) !== -1) {  // e.g. `abandoned=railway`
                        status = k;
                        primary = v;
                        classes += ' tag-' + v;
                    }  // else ignore e.g.  `highway=path + abandoned=railway`

                    if (status) break;
                }
            }

            if (status) {
                classes += ' tag-status tag-status-' + status; //iD v1.9.2
                //classes += ' tag-ephemeral'; //legacy Hoot
            }

            // add any secondary (structure) tags
            for (i = 0; i < secondaries.length; i++) {
                k = secondaries[i];
                v = t[k];
                if (!v || v === 'no') continue;
                classes += ' tag-' + k + ' tag-' + k + '-' + v;
            }

            //added for iD v1.9.2
            // For highways, look for surface tagging..
            if (primary === 'highway') {
                var paved = (t.highway !== 'track');
                for (k in t) {
                    v = t[k];
                    if (k in iD.pavedTags) {
                        paved = !!iD.pavedTags[k][v];
                        break;
                    }
                }
                if (!paved) {
                    classes += ' tag-unpaved';
                }
            }

            // For hoot enity id make sure id and origid exist first
            if(entity.id && entity.origid){
                var lyrid = entity.id.replace(entity.origid+'_','');

                // For merged datasets, assign color class of source layer
                var lyr = context.hoot().model.conflicts.getFeatureLayer(entity);
                if (lyr && lyr.name) {
                    classes += ' tag-hoot';
                }
                if (lyr && lyr.merged) {
                    var id;
                    var sourceid = parseInt(t['hoot:status']);
                    switch(sourceid) {
                    case 1:
                    case 2:
                        id = context.hoot().model.conflicts.getSourceLayerId(entity);
                        break;
                    case 0:
                    case 3:
                    default:
                        id = lyr.mapId;
                        break;
                    }
                    classes += ' tag-hoot-' + (id || sourceid);
                } else {
                    classes += ' tag-hoot-'+lyrid.toString();
                }
            }


            classes = classes.trim();

            if (classes !== value) {
                d3.select(this).attr('class', classes);
            }
        });
    };

    tagClasses.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        return tagClasses;
    };

    return tagClasses;
};
