/*******************************************************************************************************
 * File: about.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 7/11/18
 *******************************************************************************************************/

import API           from '../managers/api';
import { aboutForm } from '../config/formMetadata';
import buildInfo     from '../config/buildInfo.json';
import FormFactory   from '../tools/formFactory';

export default class About {
    constructor() {
        this.form = aboutForm.call( this );

        this.aboutData = [];
    }

    render() {
        this.getAboutData()
            .then( () => this.createForm() );
    }

    async getAboutData() {
        try {
            let info = await Promise.all( [
                API.getCoreVersionInfo(),
                API.getServicesVersionInfo()
            ] );

            info.forEach( d => this.aboutData.push( d ) );
        } catch( e ) {
            console.log( 'Unable to get Hootenanny core and service info.', e );
        }

        // build info will always be available
        this.aboutData.push( buildInfo );
    }

    createForm() {
        this.formData = aboutForm.call( this );

        let metadata = {
            title: 'About Hootenanny',
            form: this.formData,
            button: {
                text: 'Download User Guide',
                id: 'downloadUserGuideBtn',
                onClick: () => this.handleSubmit()
            }
        };

        this.container = new FormFactory().generateForm( 'body', 'about-hootenanny', metadata );
        this.form      = this.container.select( 'form' );
        d3.select( '#downloadUserGuideBtn' ).property( 'disabled', false );
    }

    createTableFieldset( field ) {
        let table = field
            .selectAll( '.about-item' )
            .append( 'div' )
            .data( this.aboutData );

        let rows = table
            .enter()
            .append( 'div' )
            .classed( 'about-item fill-white keyline-bottom', true );

        rows
            .append( 'span' )
            .text( d => {
                let builtBy = d.buildBy || d.user;

                return `${ d.name } - Version: ${ d.version } - Built By: ${ builtBy }`;
            } );
    }

    handleSubmit() {

    }
}