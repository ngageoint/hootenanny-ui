/*******************************************************************************************************
 * File: selectionRetriever.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/28/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export default class SelectionRetriever {
    constructor( advOptsForm, fieldsMetadata ) {
        this.form     = advOptsForm;
        this.metadata = fieldsMetadata;
    }

    generateSelectedValues() {
        _.reduce( this.metadata, ( results, item ) => {
            if ( item.members[ 0 ].name === 'Enabled' &&
                !this.form.select( `#${ item.members[ 0 ].id }` ).property( 'checked' ) ) return results;

            this.getAllValues( item, results );

            return results;
        }, [] );
    }

    getAllValues( item, results  ) {
        _.forEach( item.members, subItem => {
            switch ( subItem.elem_type ) {
                case 'checkbox': {
                    this.getCheckValue( item, subItem, results );
                    break;
                }
                case 'checkplus': {
                    if ( !this.form.select( `#${ subItem.id }` ).property( 'checked' ) ) break;

                    // recursion baby
                    if ( subItem.members ) {
                        this.getAllValues( subItem, results );
                    }
                    break;
                }
                default: {
                    this.getTextValue( item, subItem, results );
                    break;
                }
            }
        } );
    }

    getCheckValue( item, subItem, results ) {
        let selected = this.form.select( `#${ subItem.id }` ).property( 'checked' ),
            key      = {};

        if ( !selected ) return;

        if ( subItem.hoot_key ) {
            key.name  = subItem.hoot_key;
            key.value = selected;

            results.push( key );
        }

        if ( subItem.hoot_val ) {
            let idx = results.indexOf( _.find( results, obj => obj.name === item.hoot_key ) );

            if ( idx > -1 && results[ idx ].value.indexOf( subItem.hoot_val ) === -1) { // hoot key already exists but the value does not
                // concat new value to existing string
                results[ idx ].value += ';' + subItem.hoot_val;
            } else { // add new entry
                key.name = item.hoot_key;
                key.value = subItem.hoot_val;

                results.push( key );
            }
        }
    }

    getTextValue( item, subItem, results ) {
        let node = this.form.select( `#${ subItem.id }` ).node(),
            value,
            key = {};

        if ( node ) {
            value = node.value;
        }

        if ( !value || !value.length ) {
            value = subItem.defaultvalue;
        }

        if ( subItem.hoot_key ) {

        }
    }
}