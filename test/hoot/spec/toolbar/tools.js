/** ****************************************************************************************************
 * File: tools.js
 * Project: hootenanny-ui
 * @author Jack Grossman on 11/19/18
 *******************************************************************************************************/

describe(" UI tools ", () => {

    it(" Tool button is active ", done => {

        d3.select("#bar  div.limiter  div:nth-child(1)  button").dispatch("click")

        setTimeout(() => {
            expect(d3.select("#bar div.limiter ul").size() ).to.be.equal( 1 )
            done();
        }, 1000)
    })
    it(" Measurement and Clip tools appear ", done => {

        d3.select("#bar  div.limiter  div:nth-child(1)  button").dispatch("click")

        setTimeout(() => {
            expect(d3.selectAll("#bar div.limiter ul li").size( )).to.be.equal( 2 )
            done()
        }, 1000)

    })
    it(" All measurement tools active ", done => {
        setTimeout(() => {
            expect(d3.selectAll("#bar div.limiter ul ul li").size() ).to.be.equal( 3 )
            done()
        }, 1000)
    })
})