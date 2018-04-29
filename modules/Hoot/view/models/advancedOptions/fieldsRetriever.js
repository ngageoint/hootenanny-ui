/*******************************************************************************************************
 * File: fieldsRetriever.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/24/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export default class FieldsRetriever {
    constructor( options ) {
        this.baseOpts       = options.base;
        this.horizontalOpts = options.horizontal;
        this.averageOpts    = options.average;
        this.referenceOpts  = options.reference;
    }

    getDefaultFields() {
        let conflateType = d3.select( '#conflateType' ).node().value,
            overrideOpts = conflateType === 'Reference'
                ? this.referenceOpts
                : conflateType === 'Average'
                    ? this.averageOpts
                    : this.horizontalOpts;

        let overrideKeys = _.map( _.cloneDeep( overrideOpts[ 0 ] ).members, member => {
            member.id       = member.hoot_key.indexOf( '.creators' ) > -1 ? member.id : member.hoot_key.replace( /\./g, '_' );
            member.required = member.required || false;

            return member;
        } );

        return this.mergeWithBase( _.cloneDeep( this.baseOpts ), overrideKeys );
    }

    mergeWithBase( members, overrideKeys ) {
        _.forEach( members, item => {
            let memberIds = _.map( item.members, 'id' ),
                replacers = _.filter( overrideKeys, key => _.includes( memberIds, key.id ) );

            _.forEach( replacers, replaceItem => {
                let match = _.find( item.members, { id: replaceItem.id } );

                if ( match ) {
                    match.defaultvalue = replaceItem.defaultvalue;
                    match.required     = replaceItem.required;
                }
            } );

            _.forEach( item.members, subItem => {
                if ( subItem.members && subItem.members.length ) {
                    subItem.members = this.mergeWithBase( subItem.members, overrideKeys );
                }
            } );
        } );

        return members;
    }

    generateFields( fieldData ) {
        return _.reduce( fieldData, ( arr, item ) => {
            let field = {};

            field.label = field.heading = item.name;
            field.id          = item.id;
            field.type        = item.elem_type;
            field.description = item.description;

            field.children = _.reduce( item.members, ( arr, subItem ) => {
                let subField = {};

                subField.id          = subItem.id;
                subField.label       = subItem.name;
                subField.type        = subItem.elem_type;
                subField.placeholder = subItem.defaultvalue;
                subField.description = subItem.description;
                subField.placeholder = subItem.defaultvalue;

                if ( subItem.required )
                    subField.required = subItem.required;

                if ( subItem.dependency )
                    subField.dependency = subItem.dependency;

                if ( subItem.dependents )
                    subField.dependents = subItem.dependents;

                if ( subItem.members )
                    subField.combobox = subItem.members;

                if ( subItem.onchange )
                    subField.onchange = subItem.onchange;

                switch ( subItem.elem_type ) {
                    case 'bool': {
                        console.log( subItem );
                        if ( subItem.members ) {
                            _.forEach( subItem.members, member => {
                                if ( member.isDefault === 'true' ) {
                                    subField.placeholder = member.name;
                                }
                            } );
                        } else {
                            subField.combobox = [ { name: 'true' }, { name: 'false' } ];
                        }
                        break;
                    }
                    case 'checkplus': {
                        subField.subchecks = _.reduce( subItem.members, ( arr, member ) => {
                            let subcheck = {};

                            subcheck.id          = member.id;
                            subcheck.label       = member.name;
                            subcheck.type        = member.elem_type;
                            subcheck.placeholder = member.defaultvalue;
                            subcheck.description = member.description;
                            subcheck.required    = member.required;

                            if ( _.includes( [ 'long', 'int', 'double' ], member.elem_type ) ) {
                                subcheck.maxvalue = member.maxvalue;
                                subcheck.minvalue = member.minvalue;
                                subcheck.disabled = subItem.disabled || false;
                                subcheck.onchange = 'true';
                            }

                            arr.push( subcheck );

                            return arr;
                        }, [] );
                        break;
                    }
                    case 'long':
                    case 'int':
                    case 'double': {
                        subField.maxvalue = subItem.maxvalue;
                        subField.minvalue = subItem.minvalue;
                        subField.disabled = subItem.disabled || false;
                        subField.onchange = 'true';
                        break;
                    }
                }

                arr.push( subField );
                return arr;
            }, [] );

            arr.push( field );
            return arr;
        }, [] );
    }
}