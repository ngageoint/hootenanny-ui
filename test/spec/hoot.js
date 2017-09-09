describe('Hoot.hoot', function(){
    var hoot;

    before(function() {
        var testContext = {};
        testContext.config = {};
        testContext.config.JobStatusQueryInterval = 10000;
        testContext.config.defaultScript = "TDS.js";
        testContext.config.url = "/hoot-services/osm";
        hoot = Hoot.hoot(testContext);
    });

    describe('.palette',function(){
        it('returns a color from the palette', function() {
            expect(hoot.palette('orange')).to.eql('#ff7f2a');
            expect(hoot.palette('#5fbcd3')).to.eql('blue');
            expect(hoot.palette('yellow')).to.eql('#ff7f2a');
        });
    });

    describe('.checkForValidCoordinates',function(){
        it('checks for valid coordinates', function() {
            expect(hoot.checkForValidCoordinates([-104.152484, 39.593397])).to.be.true;
            expect(hoot.checkForValidCoordinates([190])).to.be.false;
            expect(hoot.checkForValidCoordinates([100,54,55])).to.be.false;
            expect(hoot.checkForValidCoordinates(['lat',54])).to.be.false;
            expect(hoot.checkForValidCoordinates([-104,'long'])).to.be.false;
            expect(hoot.checkForValidCoordinates([181, 40])).to.be.false;
            expect(hoot.checkForValidCoordinates([-181, 40])).to.be.false;
            expect(hoot.checkForValidCoordinates([100, 91])).to.be.false;
            expect(hoot.checkForValidCoordinates([100, -91])).to.be.false;
        });
    });

    describe('.checkForUnallowableWords',function(){
        it('checks for unallowable words', function(){
            expect(hoot.checkForUnallowableWords('hootTestA')).to.be.true;
            expect(hoot.checkForUnallowableWords('root')).to.be.false;
            expect(hoot.checkForUnallowableWords('Datasets')).to.be.false;
            expect(hoot.checkForUnallowableWords('FOLDER')).to.be.false;
        });
    });

    describe('.checkForUnallowedChar',function(){
        it('checks for unallowable characters', function() {
            expect(hoot.checkForUnallowedChar('hootTestA')).to.be.true;
            expect(hoot.checkForUnallowedChar('hootFolder')).to.be.true;
            expect(hoot.checkForUnallowedChar('Folder')).to.eql('Please do not use any unallowable terms: Folder.');
            expect(hoot.checkForUnallowedChar('hootTestA!')).to.eql('Please do not use special characters: hootTestA!.');
        });
    });

    describe('.removeSpecialChar',function(){
        it('removes special characters from a string', function() {
            var retval = 'hootTestA';
            expect(hoot.removeSpecialChar('hootTestA')).to.be.eql(retval);
            expect(hoot.removeSpecialChar('$hootTestA')).to.be.eql(retval);
            expect(hoot.removeSpecialChar('$hoot.TestA')).to.be.eql(retval);
            expect(hoot.removeSpecialChar('hoot.TestA')).to.be.eql(retval);
            expect(hoot.removeSpecialChar('hootTestA&')).to.be.eql(retval);
        });
    });

    describe('.checkForSpecialChar',function(){
        it('checks for special characters from a string', function() {
            expect(hoot.checkForSpecialChar('hootTestA')).to.be.true;
            expect(hoot.checkForSpecialChar('hootFolder')).to.be.true;
            expect(hoot.checkForSpecialChar('hootTestA!')).to.be.false;
            expect(hoot.checkForSpecialChar('$hootTestA')).to.be.false;
        });
    });

    describe('.sortTranslations',function() {
        it('sorts translations by DEFAULT and then by NAME', function() {
            var trans = [
                          {
                            "PATH": "translations/b.js",
                            "CANEXPORT": false,
                            "DESCRIPTION": "b",
                            "DEFAULT": false,
                            "NAME": "b"
                          },
                          {
                            "PATH": "translations/ZZZ.js",
                            "CANEXPORT": false,
                            "DESCRIPTION": "test ZZZ",
                            "DEFAULT": true,
                            "NAME": "ZZZ"
                          },
                          {
                            "PATH": "translations/c.js",
                            "CANEXPORT": true,
                            "DESCRIPTION": "c",
                            "NAME": "c"
                          },
                          {
                            "PATH": "translations/aaa.js",
                            "CANEXPORT": true,
                            "DESCRIPTION": "test aaa",
                            "DEFAULT": true,
                            "NAME": "aaa"
                          }
                        ];
            var expectedNames = ['aaa', 'ZZZ', 'b', 'c'];
            var sortedNames = trans.sort(hoot.sortTranslations).map(function(d) {
                return d.NAME;
            });
            expect(sortedNames).to.be.eql(expectedNames);
        });
    });

});