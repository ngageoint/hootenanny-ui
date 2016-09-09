describe('Folders', function(){
    var sandbox;
    var folder;

    before(function () {
     this.server = sinon.fakeServer.create();
     var testContext = {};
        testContext.config = {};
        testContext.config.JobStatusQueryInterval = 10000;
        testContext.config.defaultScript = "TDS.js";
        testContext.config.url = "/hoot-services/osm";
        iD.data.config = testContext.config;
        var hoot_model = Hoot.model(testContext);
        folder = hoot_model.folders;
    });

    after(function() {
        this.server.restore();
    });

    describe('.refresh', function(){
        it('should update available folders', function() {
         
            var resp = JSON.stringify({"folders":[{"id":1, "name":"parent folder", "parentId":0},
                        {"id":2, "name":"child folder", "parentId":1}]});

            var expectedResp = [{"id":1, "name":"parent folder", "parentId": 0},
                        {"id":2, "name":"child folder", "parentId": 1}];
           
            var callback = sinon.spy();
            folder.refresh(callback);

            this.server.respondWith("GET", "/hoot-services/osm/api/0.6/map/folders",
                  [200, {"Content-Type": "text/plain"}, resp]);
            this.server.respond();

            expect(callback.calledWith(expectedResp)).to.equal(true);
        });
    });

    describe('.delete folder', function(){
        it('should fail if folder id is less than or equal to 0', function() {
            var retval = folder.deleteFolder(-2,function(resp){var b = resp;});
            expect(retval).to.equal(false);
        });
    });

    describe('.set available folders', function(){
        var expectedResp = [{"id":1, "name":"parent folder", "parentId": 0},
                        {"id":2, "name":"child folder", "parentId": 1}];

        it('should return available folders', function() {
            folder.setAvailFolders(expectedResp);
            expect(folder.getAvailFolders()).to.equal(expectedResp);
        });
    });
});