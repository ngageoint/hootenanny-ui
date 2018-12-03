/** ****************************************************************************************************
 * File: tools.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/19/18
 *******************************************************************************************************/

describe( 'UI tools', () => {

    it( 'Tool button is active', done => {

        d3.select('button.tools-toggle').dispatch('click');

        setTimeout(() => {
            var toolsDropdown = d3.select('.tools-menu');
            expect(toolsDropdown.size() ).to.be.equal( 1 );
            done();
        }, 1000);
    } );
    it( 'Measurement and Clip tools appear', done => {

        var menuItems = d3.selectAll('li.menu-item');

        setTimeout(() => {
            expect(menuItems.size( )).to.be.equal( 2 );
            done();
        }, 1000);

    } );
    it( 'All measurement tools active', done => {

        //iD-icon-line.tools-measure

        var measurementTool = d3.select('li.menu-item.tools-measure');
        measurementTool.dispatch('mouseenter');

        setTimeout(() => {
            var subMenu = d3.selectAll('.tools-measure');
            expect(subMenu.size( )).to.be.equal( 4 );
            done();
        }, 1000);
    } );
    it( 'All clip tools active', done => {

        var clipTools = d3.select('li.menu-item.tools-clip');
        clipTools.dispatch('mouseenter');
        setTimeout(() => {
            var clipMenu = d3.select('.iD-operation-split'); 
            expect(clipMenu.size( )).to.be.equal( 1 );
            done();
        });
    } );
} );