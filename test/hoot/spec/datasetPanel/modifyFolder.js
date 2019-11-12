import ModifyFolder from '../../../../modules/Hoot/ui/modals/modifyFolder';

describe( 'modify folder', function() {
    var folders, modifyFolder;

    beforeEach(function() {
        // runs before all tests in this file regardless where this line is defined.
        modifyFolder = new ModifyFolder();

        folders = [
            {
                id: 123,
                path: "/ Parent1",
                parentId: 0,
            },
            {
                id: 124,
                path: "/ Parent1 / Child1a",
                parentId: 123,
            },
            {
                id: 125,
                path: "/ Parent1 / Child1b",
                parentId: 123,
            },
            {
                id: 126,
                path: "/ Parent1 / Child1b / Grandchild1b",
                parentId: 125,
            },
            {
                id: 127,
                path: "/ Parent2",
                parentId: 0,
            },
            {
                id: 128,
                path: "/ Parent2 / Child2a",
                parentId: 127,
            },
            {
                id: 129,
                path: "/ Parent2 / Child2b",
                parentId: 127,
            },
            {
                id: 130,
                path: "/ Parent2 / Child2b / Grandchild2b",
                parentId: 129,
            },
            {
                id: 131,
                path: "/ Parent2 / Child2b / Grandchild2b / GreatGrandchild2b",
                parentId: 130,
            },
        ];
    });

    it( 'finds descendents', function() {
        expect(modifyFolder.getDescendents([123], folders)).to.eql([123, 124, 125, 126]);
        expect(modifyFolder.getDescendents([127], folders)).to.eql([127, 128, 129, 130, 131]);
    } );

    it( 'finds descendents of multiple siblings', function() {
        expect(modifyFolder.getDescendents([124, 125], folders)).to.eql([124, 125, 126]);
        expect(modifyFolder.getDescendents([128, 129], folders)).to.eql([128, 129, 130, 131]);
    } );

    it( 'finds descendents of multiple non-siblings', function() {
        expect(modifyFolder.getDescendents([126, 130], folders)).to.eql([126, 130, 131]);
        expect(modifyFolder.getDescendents([124, 126, 128, 130], folders)).to.eql([124, 126, 128, 130, 131]);
    } );
});
