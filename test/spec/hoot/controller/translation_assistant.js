var ta;
describe('iD.Hoot.control.TranslationAssistant', function() {

    before(function () {
        Hoot.control({});
        ta = Hoot.control.TranslationAssistant();
    });

    describe('validateMapping', function() {
        var attributeMappingValid1 = {
            "aims_roads_kabul": {
                "CLASS": {
                    "Feature Code": "CLASS"
                },
                "ID_": "IGNORED",
                "LENGTH_": "IGNORED",
                "NAME1_": "IGNORED",
                "NAME2_": "IGNORED",
                "PARTS_": "IGNORED",
                "POINTS_": "IGNORED",
                "SHAPE_Leng": "IGNORED"
            },
            "aims_bphs_kabul": {
                "FIELD1": "IGNORED",
                "FIELD2": "IGNORED",
                "FIELD3": "IGNORED",
                "FIELD4": "IGNORED",
                "FIELD5": "IGNORED",
                "FIELD6": "IGNORED",
                "ID": "IGNORED",
                "ID_32_DIST": "IGNORED",
                "ID_32_PROV": "IGNORED",
                "LAT": "IGNORED",
                "LON": "IGNORED",
                "NAME_32_DI": "IGNORED",
                "NAME_32_PR": "IGNORED",
                "PRIMARY_NA": {
                    "Geographic Name Information: Full Name": "PRIMARY_NA"
                },
                "TYPE_ID": "IGNORED",
                "TYPE_NAME": {
                    "Feature Code": "AL013: Building"
                }
            }
        };
        it('should pass if each layer has Feature Code mapped', function() {
            expect(ta.validateMapping(attributeMappingValid1).state).to.be.true;
        })
        it('should report no layer name if validate succeeds', function() {
            expect(ta.validateMapping(attributeMappingValid1).layers).to.be.empty;
        })

        var attributeMappingValid2 = {
            "aims_roads_kabul": {
                "CLASS": {
                    "Feature Code": "CLASS"
                },
                "ID_": "IGNORED",
                "LENGTH_": "IGNORED",
                "NAME1_": "IGNORED",
                "NAME2_": "IGNORED",
                "PARTS_": "IGNORED",
                "POINTS_": "IGNORED",
                "SHAPE_Leng": "IGNORED"
            },
            "aims_bphs_kabul": {
                "FIELD1": "IGNORED",
                "FIELD2": "IGNORED",
                "FIELD3": "IGNORED",
                "FIELD4": "IGNORED",
                "FIELD5": "IGNORED",
                "FIELD6": "IGNORED",
                "ID": "IGNORED",
                "ID_32_DIST": "IGNORED",
                "ID_32_PROV": "IGNORED",
                "LAT": "IGNORED",
                "LON": "IGNORED",
                "NAME_32_DI": "IGNORED",
                "NAME_32_PR": "IGNORED",
                "PRIMARY_NA": "IGNORED",
                "TYPE_ID": "IGNORED",
                "TYPE_NAME": "IGNORED"
            }
        };
        it('should pass if a layer all attributes IGNORED', function() {
            expect(ta.validateMapping(attributeMappingValid2).state).to.be.true;
        })
 
        var attributeMappingInvalid1 = {
            "aims_roads_kabul": {
                "CLASS": {
                    "Feature Code": "CLASS"
                },
                "ID_": "IGNORED",
                "LENGTH_": "IGNORED",
                "NAME1_": "IGNORED",
                "NAME2_": "IGNORED",
                "PARTS_": "IGNORED",
                "POINTS_": "IGNORED",
                "SHAPE_Leng": "IGNORED"
            },
            "aims_bphs_kabul": {
                "FIELD1": "IGNORED",
                "FIELD2": "IGNORED",
                "FIELD3": "IGNORED",
                "FIELD4": "IGNORED",
                "FIELD5": "IGNORED",
                "FIELD6": "IGNORED",
                "ID": "IGNORED",
                "ID_32_DIST": "IGNORED",
                "ID_32_PROV": "IGNORED",
                "LAT": "IGNORED",
                "LON": "IGNORED",
                "NAME_32_DI": "IGNORED",
                "NAME_32_PR": "IGNORED",
                "PRIMARY_NA": {
                    "Geographic Name Information: Full Name": "PRIMARY_NA"
                },
                "TYPE_ID": "IGNORED",
                "TYPE_NAME": "IGNORED"
            }
        };
        it('should fail if a layer has an attribute mapped but not Feature Code', function() {
            expect(ta.validateMapping(attributeMappingInvalid1).state).to.be.false;
        })
        it('should report layer name if validate fails', function() {
            expect(ta.validateMapping(attributeMappingInvalid1).layers).to.contain('aims_bphs_kabul');
        })

        var attributeMappingInvalid2 = {
            "aims_roads_kabul": {
                "CLASS": "IGNORED",
                "ID_": "IGNORED",
                "LENGTH_": "IGNORED",
                "NAME1_": "IGNORED",
                "NAME2_": "IGNORED",
                "PARTS_": "IGNORED",
                "POINTS_": "IGNORED",
                "SHAPE_Leng": "IGNORED"
            },
            "aims_bphs_kabul": {
                "FIELD1": "IGNORED",
                "FIELD2": "IGNORED",
                "FIELD3": "IGNORED",
                "FIELD4": "IGNORED",
                "FIELD5": "IGNORED",
                "FIELD6": "IGNORED",
                "ID": "IGNORED",
                "ID_32_DIST": "IGNORED",
                "ID_32_PROV": "IGNORED",
                "LAT": "IGNORED",
                "LON": "IGNORED",
                "NAME_32_DI": "IGNORED",
                "NAME_32_PR": "IGNORED",
                "PRIMARY_NA": "IGNORED",
                "TYPE_ID": "IGNORED",
                "TYPE_NAME": "IGNORED"
            }
        };
        it('should fail if all attributes in all layers are IGNORED', function() {
            expect(ta.validateMapping(attributeMappingInvalid2).state).to.be.false;
        })
        it('should report layer name if validate fails', function() {
            expect(ta.validateMapping(attributeMappingInvalid2).layers).to.contain('at least one layer');
        })
    });
    
});