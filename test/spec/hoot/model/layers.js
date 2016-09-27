describe('Layers', function(){
    var sandbox;
    var layer;

    before(function () {
     this.server = sinon.fakeServer.create();
     var testContext = {};
        testContext.config = {};
        testContext.config.JobStatusQueryInterval = 10000;
        testContext.config.defaultScript = "TDS.js";
        testContext.config.url = "/hoot-services/osm";
        iD.data.config = testContext.config;
        var hoot_model = Hoot.model(testContext);
        layer = hoot_model.layers;
    });

    after(function() {
        this.server.restore();
    });

    describe('.get map name or id',function(){
        var resp = JSON.stringify({"layers":[{"id":1, "name":"test name 1"},
                        {"id":2, "name":"test name 2"}]});

            var expectedResp = [{"id":1, "name":"test name 1"},
                        {"id":2, "name":"test name 2"}];

        beforeEach(function() {
            var callback = sinon.spy();
            layer.refresh(callback);

            this.server.respondWith("GET", "/hoot-services/osm/api/0.6/map/layers",
                  [200, {"Content-Type": "text/plain"}, resp]);
            this.server.respond();
        });

        it('should return map name', function() {
            var input = 2;
            var expectedOutput = "test name 2";

            expect(layer.getNameBymapId(input)).to.equal(expectedOutput);
        });

        it('should return null name since no map exists', function() {
            var input = 3;
            var expectedOutput = null;

            expect(layer.getNameBymapId(input)).to.equal(expectedOutput);
        });

        it('should return map id', function(){
            var input = "test name 1";
            var expectedOutput = 1;

            expect(layer.getmapIdByName(input)).to.equal(expectedOutput);
        });

        it('should return null id since no map exists', function() {
            var input = "test name 3";
            var expectedOutput = null;

            expect(layer.getmapIdByName(input)).to.equal(expectedOutput);
        });

    });

    describe('.refresh', function(){
        it('should update available layers', function() {
         
            var resp = JSON.stringify({"layers":[{"id":1, "name":"test name 1"},
                        {"id":2, "name":"test name 2"}]});

            var expectedResp = [{"id":1, "name":"test name 1"},
                        {"id":2, "name":"test name 2"}];
           
            var callback = sinon.spy();
            //Hoot.model.REST('getAvailLayers', callback);
            layer.refresh(callback);

            this.server.respondWith("GET", "/hoot-services/osm/api/0.6/map/layers",
                  [200, {"Content-Type": "text/plain"}, resp]);
            this.server.respond();

            expect(callback.calledWith(expectedResp)).to.equal(true);
        });
    });

    describe('.selectedLayers', function(){
        var selectedLayers = [1,2];

        it('should return selected layer array', function() {
            layer.setSelectedLayers(selectedLayers);
            expect(layer.getSelectedLayers()).to.equal(selectedLayers);
        });
    });
});