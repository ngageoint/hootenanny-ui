/*******************************************************************************************************
 * File: translationManager.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 9/5/18
 *******************************************************************************************************/

export default class TranslationManager {
    constructor( hoot ) {
        this.hoot = hoot;

        this.availableTranslations = [];
        this.defaultTranslation    = 'OSM';
        this.activeTranslation     = this.defaultTranslation;
        this.previousTranslation   = null;
        this.activeSchema          = null;
    }

    setActiveTranslation( translation ) {
        this.previousTranslation = this.activeTranslation;
        this.activeTranslation   = translation;
        this.hoot.events.emit( 'active-translation-change' );
    }

    async getTranslations() {
        try {
            let translations = await this.hoot.api.getCapabilities();

            this.availableTranslations = [ this.defaultTranslation ].concat( Object.keys( translations ) );
        } catch ( e ) {
            console.log( e );
        }
    }
}