describe('iD.Hoot.Model.Layers', function(){
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

    describe("#refresh", function(){
        it("should update available layers", function() {
         
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

    /*    it("should fail refresh layers", function() {
         
            var resp = JSON.stringify({"layers":[{"id":1, "name":"test name 1"},
                        {"id":2, "name":"test name 2"}]});

            var expectedResp = [{"id":1, "name":"test name 1"},
                        {"id":2, "name":"test name 2"}];
           
            var callback = sinon.spy();
            //Hoot.model.REST('getAvailLayers', callback);
            layer.refresh(callback);

          

            this.server.respondWith(500, {}, "");
            this.server.respond();

            expect(callback.calledWith(expectedResp)).to.equal(true);
        });*/
    });
});