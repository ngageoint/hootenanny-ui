/**
 *
 */
var xhr;
describe('iD.Hoot.control.import', function(){
    var imprt;


    before(function () {


        var testContext = {};
        testContext.config = {};
        testContext.config.JobStatusQueryInterval = 10000;
        testContext.config.defaultScript = "TDS.js";
        testContext.config.url = "/hoot-services/osm";
        iD.data.config = testContext.config;
        var hoot_control = Hoot.control(testContext);
        imprt = Hoot.control.import(testContext, null);

    });

    after(function() {

    })

    describe("#createCombo", function(){
        it("it sets minimum items to 1.", function() {
            var a = {};
            var b = [];
            b.push('Test1');
            a.combobox = b;
            var combo = imprt.createTree(a);
            expect(combo.minItems()).to.eql(1);
          });
    });
});
