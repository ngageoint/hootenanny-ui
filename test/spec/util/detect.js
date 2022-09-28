describe('iD.detect', function() {
    var detect = iD.Detect();
    describe('absolute', function() {
        it('get the absolute url for dev webpack', function() {
            var base = 'https://localhost:8080/';
            var rel = 'hoot-services';
            var abs = detect.absolute(base, rel);
            expect(abs).to.eql('https://localhost:8080/hoot-services');
        });
        it('get the absolute url for dev tomcat', function() {
            var base = 'https://localhost:8443/hootenanny-id/';
            var rel = '../hoot-services';
            var abs = detect.absolute(base, rel);
            expect(abs).to.eql('https://localhost:8443/hoot-services');
        });
        it('get the absolute url for production', function() {
            var base = 'https://localhost/hootenanny/hootenanny-id/';
            var rel = '../hoot-services';
            var abs = detect.absolute(base, rel);
            expect(abs).to.eql('https://localhost/hootenanny/hoot-services');
        });
    });
});
