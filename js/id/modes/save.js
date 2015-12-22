iD.modes.Save = function(context) {
    var ui = iD.ui.Commit(context)
        .on('cancel', cancel)
        .on('save', save);

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    // hootCallback is for hootenany specific callback. This may need to be moved
    // in the future during upstream merge with iD code
    function save(e, tryAgain, hootCallback) {
        function withChildNodes(ids, graph) {
            return _.uniq(_.reduce(ids, function(result, id) {
                var e = graph.entity(id);
                if (e.type === 'way') {
                    var cn = graph.childNodes(e);
                    result.push.apply(result, _.pluck(_.filter(cn, 'version'), 'id'));
                }
                return result;
            }, _.clone(ids)));
        }

        var loading = iD.ui.Loading(context).message('Uploading changes to Hootenanny.').blocking(true),
            history = context.history(),
            origChanges = history.changes(iD.actions.DiscardTags(history.difference())),
            localGraph = context.graph(),
            remoteGraph = iD.Graph(history.base(), true),
            modified = _.filter(history.difference().summary(), {changeType: 'modified'}),
            toCheck = _.pluck(_.pluck(modified, 'entity'), 'id'),
            toLoad = withChildNodes(toCheck, localGraph),
            conflicts = [],
            errors = [];

        if (!tryAgain) history.perform(iD.actions.Noop());  // checkpoint
        context.container().call(loading);

        // Disabling toCheck for hoot. iD conflict validation is causing race condition
        // while retrieving the osm data and saving. 
       /* if (toCheck.length) {
            console.debug('call loadMultiple');
            context.connection().loadMultiple(toLoad, loaded, hootCallback);
        } else*/ {
            finalize(hootCallback);
        }


        // hootCallback is for hootenany specific callback. This may need to be moved
        // in the future during upstream merge with iD code
        // Reload modified entities into an alternate graph and check for conflicts..
        function loaded(err, result, hootCallback) {
            if (errors.length) return;

            if (err) {
                errors.push({
                    msg: err.responseText,
                    details: [ t('save.status_code', { code: err.status }) ]
                });
                showErrors();

            } else {
                _.each(result.data, function(entity) {
                    remoteGraph.replace(entity);
                    toLoad = _.without(toLoad, entity.id);
                });

                if (!toLoad.length) {
                    checkConflicts(hootCallback, result.force_remote);
                }
            }
        }


        // hootCallback is for hootenany specific callback. This may need to be moved
        // in the future during upstream merge with iD code
        function checkConflicts(hootCallback, doForceRemote) {
            function choice(id, text, action) {
                return { id: id, text: text, action: function() { history.replace(action); } };
            }
            function formatUser(d) {
                return '<a href="' + context.connection().userURL(d) + '" target="_blank">' + d + '</a>';
            }
            function entityName(entity) {
                return iD.util.displayName(entity) || (iD.util.displayType(entity.id) + ' ' + entity.id);
            }

            function compareVersions(local, remote) {
                if (local.version !== remote.version) return false;

                if (local.type === 'way') {
                    var children = _.union(local.nodes, remote.nodes);

                    for (var i = 0; i < children.length; i++) {
                        var a = localGraph.hasEntity(children[i]),
                            b = remoteGraph.hasEntity(children[i]);

                        if (!a || !b || a.version !== b.version) return false;
                    }
                }

                return true;
            }

            _.each(toCheck, function(id) {
                var local = localGraph.entity(id),
                    remote = remoteGraph.entity(id);

                if (compareVersions(local, remote)) return;

                var action = iD.actions.MergeRemoteChanges,
                    merge = action(id, localGraph, remoteGraph, formatUser);

                if(doForceRemote !== undefined && doForceRemote === true){
                    history.replace(merge.withOption('force_remote'));
                } else {
                    history.replace(merge);
                }
                

                var conflicts = merge.conflicts();
                if (!conflicts.length) return;  // merged safely

                var forceLocal = action(id, localGraph, remoteGraph).withOption('force_local'),
                    forceRemote = action(id, localGraph, remoteGraph).withOption('force_remote'),
                    keepMine = t('save.conflict.' + (remote.visible ? 'keep_local' : 'restore')),
                    keepTheirs = t('save.conflict.' + (remote.visible ? 'keep_remote' : 'delete'));

                conflicts.push({
                    id: id,
                    name: entityName(local),
                    details: conflicts,
                    chosen: 1,
                    choices: [
                        choice(id, keepMine, forceLocal),
                        choice(id, keepTheirs, forceRemote)
                    ]
                });
            });

            finalize(hootCallback);
        }

        // hootCallback is for hootenany specific callback. This may need to be moved
        // in the future during upstream merge with iD code
        function finalize(hootCallback) {
            if (conflicts.length) {
                conflicts.sort(function(a,b) { return b.id.localeCompare(a.id); });
                showConflicts();
            } else if (errors.length) {
                showErrors();
            } else {
            	
            	context.connection().putChangeset(
                    history.changes(iD.actions.DiscardTags(history.difference())),
                    'Hoot Save',
                    history.imageryUsed(),
                    function(err, changeset_id) {
                        if (err) {
                            var isReviewing = context.hoot().control.conflicts.isConflictReviewExist();
                            var errMsg = err.responseText;
                            errMsg += " (The feature may have been deleted by other " +
                                "user and may require reloading of the layer.";
                            if(isReviewing === true){
                                errMsg += " Will jump to next valid review item";
                            }
                            errMsg += ")";
                            errors.push({
                                msg: errMsg,
                                details: [ t('save.status_code', { code: err.status }) ]
                            });
                            
                            if(isReviewing === true){
                                showErrors(
                                    function(){
                                        context.hoot().control.conflicts.actions.traversereview.gotoNext();
                                    }
                                    
                                );
                                
                            } else {
                                showErrors();
                            }

                        } else {
                            loading.close();
                            context.flush();
                            if (hootCallback) { hootCallback(); }
                            //success(e, changeset_id);
                        }
                        context.enter(iD.modes.Browse(context));
                    });
            }
        }


        function showConflicts() {
            var selection = context.container()
                .select('#sidebar')
                .append('div')
                .attr('class','sidebar-component');

            loading.close();

            selection.call(iD.ui.Conflicts(context)
                .list(conflicts)
                .on('download', function() {
                    var data = JXON.stringify(context.connection().osmChangeJXON('CHANGEME', origChanges)),
                        win = window.open('data:text/xml,' + encodeURIComponent(data), '_blank');
                    win.focus();
                })
                .on('cancel', function() {
                    history.pop();
                    selection.remove();
                })
                .on('save', function() {
                    selection.remove();
                    save(e, true);
                })
            );
        }


        function showErrors(callback) {
            var selection = iD.ui.confirm(context.container());

            history.pop();
            loading.close();

            selection
                .select('.modal-section.header')
                .append('h3')
                .text(t('save.error'));

            addErrors(selection, errors);
            if(callback){
                selection.okButton(callback);
            } else {
                selection.okButton();
            }
            
        }


        function addErrors(selection, data) {
            var message = selection
                .select('.modal-section.message-text');

            var items = message
                .selectAll('.error-container')
                .data(data);

            var enter = items.enter()
                .append('div')
                .attr('class', 'error-container');

            enter
                .append('a')
                .attr('class', 'error-description')
                .attr('href', '#')
                .classed('hide-toggle', true)
                .text(function(d) { return d.msg || t('save.unknown_error_details'); })
                .on('click', function() {
                    var error = d3.select(this),
                        detail = d3.select(this.nextElementSibling),
                        exp = error.classed('expanded');

                    detail.style('display', exp ? 'none' : 'block');
                    error.classed('expanded', !exp);

                    d3.event.preventDefault();
                });

            var details = enter
                .append('div')
                .attr('class', 'error-detail-container')
                .style('display', 'none');

            details
                .append('ul')
                .attr('class', 'error-detail-list')
                .selectAll('li')
                .data(function(d) { return d.details || []; })
                .enter()
                .append('li')
                .attr('class', 'error-detail-item')
                .text(function(d) { return d; });

            items.exit()
                .remove();
        }

    }


    function success(e, changeset_id) {
        context.enter(iD.modes.Browse(context)
            .sidebar(iD.ui.Success(context)
                .changeset({
                    id: changeset_id,
                    comment: e.comment
                })
                .on('cancel', function(ui) {
                    context.ui().sidebar.hide(ui);
                })));
    }

    var mode = {
        id: 'save'
    };

    var behaviors = [
        iD.behavior.Hover(context),
        iD.behavior.Select(context),
        iD.behavior.Lasso(context),
        iD.modes.DragNode(context).behavior];

    mode.enter = function() {
        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        context.connection().authenticate(function() {
            context.ui().sidebar.show(ui);
        });
    };

    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        context.ui().sidebar.hide(ui);
    };

    mode.save = function(e, callback) {
        save(e, false, callback);
    };

    return mode;
};
