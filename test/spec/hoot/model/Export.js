/**
 * 
 */

describe('iD.Hoot.Model.Export', function(){
    var xhr;
    var sandbox;
    var e;
    var requests = [];

    
    before(function () {
        xhr = sinon.useFakeXMLHttpRequest();
        
        xhr.onCreate = function (req) { 
            requests.push(req); 
        };
        var testContext = {};
        testContext.config = {};
        testContext.config.JobStatusQueryInterval = 10000;
        testContext.config.defaultScript = "TDS.js";
        testContext.config.url = "/hoot-services/osm";
        iD.data.config = testContext.config;
        var hoot_model = Hoot.model(testContext);
        e = hoot_model.export;
    });
    
    after(function() {
        xhr.restore();
    })

    describe("#exportData", function(){
        it("send export request with parameters.", function(done) {
            requests = [];
            var mockContainer = {};
            mockContainer.select = function(field){
                if(field == '.reset.fileExportOutputName') {
                    var mockMethods = {};
                    mockMethods.value = function(){
                        return "out_name_123";
                    };

                    mockMethods.attr = function(field){
                        return null;
                    };
                    return mockMethods;
                    
                } else if(field == '.reset.fileExportFileType') {
                    var mockMethods = {};
                    mockMethods.value = function(){
                        return 'File Geodatabase';
                    };

                    mockMethods.attr = function(field){
                        return null;
                    };
                    return mockMethods;
                    
                }  else if(field == '.reset.fileExportTranslation') {
                    var mockMethods = {};
                    mockMethods.value = function(){
                        return null;
                    };

                    mockMethods.datum = function(){
                        var comboData = {};

                        var vals = [];
                        var val = {};
                        val.CANEXPORT = true;
                        val.DEFAULT = true;
                        val.DESCRIPTION = "Multinational Geospatial Co-production Program (MGCP) TRD3&4";
                        val.NAME = "MGCP";
                        val.PATH = "translations/MGCP_TRD4.js";
                        vals.push(val);
                        comboData.combobox = vals;
                        return comboData;
                    }

                    return mockMethods;
                
            };
            
            var mockData = {};
            mockData.name = 'test_input_name';
            e.exportData(mockContainer, mockData, sinon.spy());
            
            expect(requests.length).to.eql(1);
            var reqStr = requests[0].requestBody;
            var oReq = JSON.parse(reqStr);
            expect(oReq.translation).to.eql("translations/TDSv61.js");
            expect(oReq.inputtype).to.eql("db");
            expect(oReq.input).to.eql("test_input_name");
            expect(oReq.outputtype).to.eql("gdb");
            expect(oReq.outputname).to.eql("out_name_123");
            expect(requests[0].url).to.eql("/hoot-services/job/export/execute");
            done();
          });
    });
});
