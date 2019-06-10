describe('Hoot.managers.layerManager', function () {
    beforeEach(function() {
        // runs before all tests in this file regardless where this line is defined.
        Hoot.layers.allLayers = [];
    });

    it('deduplicates layer names', function () {

        Hoot.layers.allLayers.push(
            {name: 'foo'},
            {name: 'foo (1)'}
        );

        expect(Hoot.layers.checkLayerName('foo')).to.equal('foo (2)');
     });

    it('deduplicates layer names with layer number', function () {

        Hoot.layers.allLayers.push(
            {name: 'foo'},
            {name: 'foo (1)'}
        );

        expect(Hoot.layers.checkLayerName('foo (1)')).to.equal('foo (2)');
    });

    it('chooses layername without number if available', function () {

        Hoot.layers.allLayers.push(
            {name: 'foo (1)'}
        );

        expect(Hoot.layers.checkLayerName('foo')).to.equal('foo');
    });

    it('recycles available layer number', function () {

        Hoot.layers.allLayers.push(
            {name: 'foo'},
            {name: 'foo (3)'}
        );

        expect(Hoot.layers.checkLayerName('foo')).to.equal('foo (1)');
    });

    it('deduplicates layer names with embedded numbers', function () {

        Hoot.layers.allLayers.push(
            {name: 'foo1'},
            {name: 'foo1 (1)'}
        );

        expect(Hoot.layers.checkLayerName('foo1')).to.equal('foo1 (2)');
    });

    it('deduplicates layer names with embedded numbers and layer number', function () {

        Hoot.layers.allLayers.push(
            {name: 'foo1'},
            {name: 'foo1 (1)'}
        );

        expect(Hoot.layers.checkLayerName('foo1 (1)')).to.equal('foo1 (2)');
    });
});
