/**
 * 
 */
var xhr;
describe('iD.Hoot.Model.Import', function(){
    var imprt;
    var sandbox;
    
    before(function () {
        sandbox = sinon.sandbox.create();
        xhr = sinon.useFakeXMLHttpRequest();
        
        xhr.onCreate = function (req) { requests.push(req); };
        var testContext = {};
        testContext.config = {};
        testContext.config.JobStatusQueryInterval = 10000;
        testContext.config.defaultScript = "TDS.js";
        testContext.config.url = "/hoot-services/osm";
        iD.data.config = testContext.config;
        var hoot_model = Hoot.model(testContext);
        imprt = hoot_model.import;
        var stub = sandbox.stub(imprt, "getFormData");
        stub.returns("test_body_123");
    });
    
    after(function() {
        xhr.restore();
        sandbox.restore();
    })

    describe("#impportData", function(){
        it("send import layer request with parameters.", function() {
            requests = [];
            // Create fake user input fields values
            // May be use sinon stub?
            var mockContainer = {};
            mockContainer.select = function(field){
                if(field == '.reset.Schema'){
                    var mockMethods = {};
                    mockMethods.value = function(){
                        return "";
                    };

                    mockMethods.datum = function(){
                        var comboData = {};

                        var vals = [];
                        var val = {};
                        val.CANEXPORT = false;
                        val.DEFAULT = true;
                        val.DESCRIPTION = "CASI";
                        val.NAME = "CASI";
                        val.PATH = "translations/CASI.js";
                        vals.push(val);
                        comboData.combobox = vals;
                        return comboData;
                    };
                    return mockMethods;
                } else if(field == '.reset.importImportType') {
                    var mockMethods = {};
                    mockMethods.value = function(){
                        return "File (osm,shp,zip)";
                    };

                    mockMethods.datum = function(){
                        var comboData = {};

                        var vals = [];
                        var val = {};
                        val.title = "File (osm,shp,zip)";
                        val.value = "FILE";
                        vals.push(val);
                        val = {};
                        val.title = "Directory (FGDB)";
                        val.value = "DIR";
                        vals.push(val);
                        comboData.combobox2 = vals;
                        return comboData;
                    };
                    return mockMethods;
                    
                } else if(field == '.reset.LayerName') {
                    var mockMethods = {};
                    mockMethods.value = function(){
                        return 'test_layer_name';
                    };
                    return mockMethods;
                    
                }
                
            };
            
            // run import
            imprt.importData(mockContainer, sinon.spy());
            
            expect(requests.length).to.eql(1);
            var reqStr = requests[0].requestBody;
            var reqUrl = requests[0].url;

            expect(reqStr).to.eql("test_body_123");
            expect(reqUrl).to.eql("/hoot-services/ingest/ingest/upload?TRANSLATION=TDSv61.js&INPUT_TYPE=FILE&INPUT_NAME=test_layer_name");
            
          });
    });

    describe("#createCombo", function(){
        it("it sets minimum items to 1.", function() {
            var a = {};
            var b = [];
            b.push('Test1');
            a.combobox = b;
            var combo = imprt.createCombo(a);
            expect(combo.minItems()).to.eql(1);
          });
    });
});
