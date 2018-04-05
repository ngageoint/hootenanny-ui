/*******************************************************************************************************
 * File: conflateForm.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/5/18
 *******************************************************************************************************/

class LayerConflateForm {
    constructor( container ) {
        this.container = container;
    }

    render() {
        this.form = this.container.select( '.wrapper' )
            .append( 'form' )
            .classed( 'round fill-white strong', true );

        this.toggleButton = this.form.append( 'a' )
            .classed( 'toggle-button strong round _icon big light conflate', true )
            .attr( 'href', '#' )
            .on( 'click', () => this.toggleForm() );

        this.toggleButton.append( 'span' )
            .classed( 'strong', true )
            .text( 'Conflate' );
    }

    remove() {
        if ( this.form ) {
            this.form.remove();
        }
    }

    toggleForm() {
        let buttonState = this.toggleButton.classed( 'active' );

        this.toggleButton.classed( 'active', !buttonState );
    }
}

export default LayerConflateForm;