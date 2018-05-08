/*******************************************************************************************************
 * File: conflicts.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 5/8/18
 *******************************************************************************************************/
 
export default class Conflicts {
    constructor( contentContainer ) {
        this.contentContainer = contentContainer;
    }

    init() {

        this.render();
    }

    render() {
        this.createContainer();
    }

    createContainer() {
        this.container = this.contentContainer.append( 'div' )
            .attr( 'id', 'conflicts-container' )
            .classed( 'pin-botom review-block unclickable', true )
            .append( 'div' )
            .attr( 'id', 'conflicts-list' )
            .classed( 'fillD clickable', true );
    }
}