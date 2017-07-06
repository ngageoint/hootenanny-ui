# See the README for installation instructions.

all: \
	$(BUILDJS_TARGETS) \
	dist/iD.css \
	dist/iD.js \
	dist/iD.min.js \
	dist/img/iD-sprite.svg \
	dist/img/maki-sprite.svg \
	dist/presets.js \
	dist/imagery.js

.NOTPARALLEL:

MAKI_SOURCES = node_modules/maki/src/*.svg

$(MAKI_SOURCES): node_modules/.install

dist/img/maki-sprite.svg: $(MAKI_SOURCES) Makefile
	node_modules/.bin/svg-sprite --symbol --symbol-dest . --symbol-sprite $@ $(MAKI_SOURCES)

data/feature-icons.json: $(MAKI_SOURCES)
	cp -f node_modules/maki/www/maki-sprite.json $@

dist/img/iD-sprite.svg: svg/iD-sprite.src.svg svg/iD-sprite.json
	node svg/spriteify.js --svg svg/iD-sprite.src.svg --json svg/iD-sprite.json > $@

BUILDJS_TARGETS = \
	data/presets/categories.json \
	data/presets/fields.json \
	data/presets/presets.json \
	data/presets.yaml \
	data/taginfo.json \
	data/data.js \
	dist/locales/en.js \
	dist/presets.js \
	dist/imagery.js

BUILDJS_SOURCES = \
	$(filter-out $(BUILDJS_TARGETS), $(shell find data -type f -name '*.json')) \
	data/feature-icons.json \
	data/core.yaml

$(BUILDJS_TARGETS): $(BUILDJS_SOURCES) build.js
	node build.js

dist/iD.js: \
	js/lib/bootstrap-tooltip.js \
	js/lib/d3.v3.js \
	js/lib/d3.combobox.js \
	js/lib/d3.geo.tile.js \
	js/lib/d3.jsonp.js \
	js/lib/d3.keybinding.js \
	js/lib/d3.one.js \
	js/lib/d3.dimensions.js \
	js/lib/d3.trigger.js \
	js/lib/d3.typeahead.js \
	js/lib/d3.curtain.js \
	js/lib/d3.value.js \
	js/lib/diff3.js \
	js/lib/jxon.js \
	js/lib/lodash.js \
	js/lib/osmauth.js \
	js/lib/rbush.js \
	js/lib/sexagesimal.js \
	js/lib/togeojson.js \
	js/lib/marked.js \
	js/id/start.js \
	js/id/id.js \
	js/id/services.js \
	js/id/services/*.js \
	js/id/util.js \
	js/id/util/*.js \
	js/id/geo.js \
	js/id/geo/*.js \
	js/id/actions.js \
	js/id/actions/*.js \
	js/id/behavior.js \
	js/id/behavior/*.js \
	js/id/modes.js \
	js/id/modes/*.js \
	js/id/operations.js \
	js/id/operations/*.js \
	js/id/core/*.js \
	js/id/renderer/*.js \
	js/id/svg.js \
	js/id/svg/*.js \
	js/id/ui.js \
	js/id/ui/*.js \
	js/id/ui/preset/*.js \
	js/id/presets.js \
	js/id/presets/*.js \
	js/id/validations.js \
	js/id/validations/*.js \
	js/id/end.js \
	js/lib/locale.js \
	data/introGraph.js \
	js/id/ui/schema_switcher.js \
	js/hoot/Hoot.js \
	js/hoot/tools.js \
	js/hoot/lib/FileSaver.js \
	js/hoot/model/Model.js \
	js/hoot/model/Export.js \
	js/hoot/model/Folders.js \
	js/hoot/model/Import.js \
	js/hoot/model/Layers.js \
	js/hoot/model/Conflicts.js \
	js/hoot/model/Conflate.js \
	js/hoot/model/BasemapDataset.js \
	js/hoot/model/rest.js \
	js/hoot/view/View.js \
	js/hoot/view/VersionInfo.js \
	js/hoot/view/utilities/Utilities.js \
	js/hoot/view/utilities/Dataset.js \
	js/hoot/view/utilities/BasemapDataset.js \
	js/hoot/view/utilities/Translation.js \
	js/hoot/view/utilities/ErrorLog.js \
	js/hoot/view/utilities/Reports.js \
	js/hoot/view/utilities/About.js \
	js/hoot/view/utilities/ReviewBookmarks.js \
	js/hoot/view/utilities/ReviewBookmarkNotes.js \
	js/hoot/control/Control.js \
	js/hoot/control/Conflate.js \
	js/hoot/control/conflate/Symbology.js \
	js/hoot/control/conflate/AdvancedOptions.js \
	js/hoot/control/conflate/advanced_options/*.js \
	js/hoot/control/Import.js \
	js/hoot/control/Export.js \
	js/hoot/control/Validation.js \
	js/hoot/control/View.js \
	js/hoot/control/Conflicts.js \
	js/hoot/control/translation_assistant.js \
	js/hoot/control/utilities/Utilities.js \
	js/hoot/control/utilities/Translation.js \
	js/hoot/control/utilities/BasemapDataset.js \
	js/hoot/control/utilities/Reports.js \
	js/hoot/control/utilities/Folder.js \
	js/hoot/control/utilities/Validation.js \
	js/hoot/control/utilities/Filter.js \
	js/hoot/control/utilities/ExportDataset.js \
	js/hoot/control/utilities/BulkModifyDataset.js \
	js/hoot/control/utilities/ModifyDataset.js \
	js/hoot/control/utilities/ImportDataset.js \
	js/hoot/control/utilities/BulkImportDataset.js \
	js/hoot/control/utilities/ImportDirectory.js \
	js/hoot/control/utilities/ClipDataset.js \
	js/hoot/control/conflicts/Actions.js \
	js/hoot/control/conflicts/Info.js \
	js/hoot/control/conflicts/Map.js \
	js/hoot/control/conflicts/actions/*.js \
	js/hoot/control/conflicts/info/*.js \
	js/hoot/control/conflicts/map/*.js \
	js/hoot/Ui.js \
	js/hoot/ui/FormFactory.js \
	js/hoot/ui/HootFormBase.js \
	js/hoot/ui/HootFormReviewNote.js

.INTERMEDIATE dist/iD.js: data/data.js

dist/iD.js: node_modules/.install Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

dist/iD.min.js: dist/iD.js Makefile
	@rm -f $@
	node_modules/.bin/uglifyjs $< -c -m -o $@

dist/iD.css: css/*.css
	cat css/base.css css/reset.css css/map.css css/app.css css/dgcarousel.css css/style2.css css/hoot-style.css css/translation_assistant.css > $@

node_modules/.install: package.json
	npm install --quiet
	touch node_modules/.install

clean:
	rm -f $(BUILDJS_TARGETS) data/feature-icons.json dist/iD*.js dist/iD.css

clean-coverage:
	rm -f test/istanbul_index.html
	rm -rf istanbul
	rm -rf mocha-coverage
	rm -rf cucumber-coverage
	rm -rf combined-coverage

translations:
	node data/update_locales

imagery:
	npm install --quiet editor-layer-index@git://github.com/osmlab/editor-layer-index.git#gh-pages
	node data/update_imagery

suggestions:
	npm install --quiet name-suggestion-index@git://github.com/osmlab/name-suggestion-index.git
	cp node_modules/name-suggestion-index/name-suggestions.json data/name-suggestions.json


D3_FILES = \
	node_modules/d3/src/start.js \
	node_modules/d3/src/arrays/index.js \
	node_modules/d3/src/behavior/behavior.js \
	node_modules/d3/src/behavior/drag.js \
	node_modules/d3/src/behavior/zoom.js \
	node_modules/d3/src/core/index.js \
	node_modules/d3/src/dsv/index.js \
	node_modules/d3/src/event/index.js \
	node_modules/d3/src/geo/distance.js \
	node_modules/d3/src/geo/length.js \
	node_modules/d3/src/geo/mercator.js \
	node_modules/d3/src/geo/path.js \
	node_modules/d3/src/geo/stream.js \
	node_modules/d3/src/geom/polygon.js \
	node_modules/d3/src/geom/hull.js \
	node_modules/d3/src/layout/layout.js \
	node_modules/d3/src/layout/tree.js \
	node_modules/d3/src/scale/scale.js \
	node_modules/d3/src/scale/linear.js \
	node_modules/d3/src/selection/index.js \
	node_modules/d3/src/svg/svg.js \
	node_modules/d3/src/svg/diagonal.js \
	node_modules/d3/src/transition/index.js \
	node_modules/d3/src/xhr/index.js \
	node_modules/d3/src/end.js

js/lib/d3.v3.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@
	@echo 'd3 rebuilt. Please reapply 7e2485d, 4da529f, and 223974d'

js/lib/lodash.js: Makefile
	node_modules/.bin/lodash --development --output $@ include="any,assign,bind,chunk,clone,compact,contains,debounce,difference,each,every,extend,filter,find,first,forEach,forOwn,groupBy,indexOf,intersection,isEmpty,isEqual,isFunction,keys,last,map,omit,pairs,pluck,reject,some,throttle,union,uniq,unique,values,without,flatten,value,chain,cloneDeep,merge,pick,reduce" exports="global,node"
