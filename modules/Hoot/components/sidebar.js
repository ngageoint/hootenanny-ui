/*******************************************************************************************************
 * File: sidebar.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 3/19/18
 *******************************************************************************************************/

import { sidebarForms } from '../config/domElements';

/**
 * @constructor
 */

export default class Sidebar {
    constructor( container ) {
        this.container = container;
        this.formData  = sidebarForms;
    }

    render() {
        this.form = this.createForm();

        this.createToggleButtons();
    }

    createForm() {
        return this.container.selectAll( 'form' )
            .data( this.formData )
            .enter().append( 'form' )
            .classed( 'add-dataset-form round importable-layer fill-white strong', true )
            .on( 'submit', function() {

            } );
    }

    createToggleButtons() {
        let button = this.form.append( 'a' )
            .classed( 'toggle-button strong block', true )
            .attr( 'href', '#' )
            .on( 'click', function() {
                console.log( 'click' );
            } );

        button.append( 'i' )
            .classed( 'material-icons text-center strong', true )
            .text( 'add' );

        button.append( 'span' )
            .classed( 'strong', true )
            .text( d => d.toggleButtonText );
    }
}