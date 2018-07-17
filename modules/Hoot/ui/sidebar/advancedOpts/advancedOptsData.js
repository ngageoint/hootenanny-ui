/*******************************************************************************************************
 * File: advancedOptsData.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/24/18
 *******************************************************************************************************/

import _ from 'lodash-es';

export default class AdvancedOptsData {
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

        this.defaultFields = this.mergeWithBase( _.cloneDeep( this.baseOpts ), overrideKeys );

        return this.defaultFields;
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

            field.children = _.reduce( item.members, ( arr1, subItem ) => {
                let subField = {};

                subField.id          = subItem.id;
                subField.label       = subItem.name;
                subField.type        = subItem.elem_type;
                subField.placeholder = subItem.defaultvalue;
                subField.description = subItem.description;
                subField.placeholder = subItem.defaultvalue;

                if ( subItem.required ) {
                    subField.required = subItem.required;
                }

                if ( subItem.dependency ) {
                    subField.dependency = subItem.dependency;
                }

                if ( subItem.dependents ) {
                    subField.dependents = subItem.dependents;
                }

                if ( subItem.members ) {
                    subField.combobox = subItem.members;
                }

                if ( subItem.onchange ) {
                    subField.onchange = subItem.onchange;
                }

                switch ( subItem.elem_type ) {
                    case 'bool': {
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
                        if ( !subItem.members ) break;

                        subField.subchecks = _.reduce( subItem.members, ( arr2, member ) => {
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

                            arr2.push( subcheck );

                            return arr2;
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

                arr1.push( subField );
                return arr1;
            }, [] );

            arr.push( field );
            return arr;
        }, [] );
    }

    generateSelectedValues( advOptsForm ) {
        this.form = advOptsForm;

        return _.reduce( this.defaultFields, ( results, item ) => {
            if ( item.members[ 0 ].name === 'Enabled' &&
                !this.form.select( `#${ item.members[ 0 ].id }` ).property( 'checked' ) ) return results;

            this.getAllValues( item, results );

            return results;
        }, [] );
    }

    getAllValues( item, results ) {
        _.forEach( item.members, subItem => {
            switch ( subItem.elem_type ) {
                case 'checkbox': {
                    this.getCheckValue( item, subItem, results );
                    break;
                }
                case 'checkplus': {
                    if ( !this.form.select( `#${ subItem.id }` ).property( 'checked' ) ) break;

                    this.getCheckValue( item, subItem, results );

                    if ( subItem.members ) {
                        this.getAllValues( subItem, results );
                    }
                    break;
                }
                case 'list': {
                    this.getListValue( item, subItem, results );
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

            if ( idx > -1 && results[ idx ].value.indexOf( subItem.hoot_val ) === -1 ) {
                // concat new value to existing string
                results[ idx ].value += ';' + subItem.hoot_val;
            } else {
                // add new entry
                key.name  = item.hoot_key;
                key.value = subItem.hoot_val;

                results.push( key );
            }
        }
    }

    getListValue( item, subItem, results ) {
        let node  = this.form.select( `${ subItem.id }` ).node(),
            value = node ? node.value : null;

        if ( !value || !value.length ) {
            value = subItem.defaultvalue;
        }

        let selectedMember = _.find( subItem.members, { name: value } );

        _.forEach( selectedMember.members, subMember => {
            let node  = this.form.select( `${ subMember.id }` ).node(),
                subValue = node ? node.value : null,
                key   = {};

            if ( !subValue || !subValue.length ) {
                subValue = subMember.defaultvalue;
            }

            if ( subMember.hoot_key ) {
                let idx = results.indexOf( _.find( results, obj => obj.name === subMember.hoot_key ) );

                if ( idx > -1 && results[ idx ].value.indexOf( subValue ) === -1 ) {
                    results[ idx ].value += ';' + subValue;
                } else {
                    key.name  = subMember.hoot_key;
                    key.value = subValue;
                    results.push( key );
                }
            }
        } );
    }

    getTextValue( item, subItem, results ) {
        let node  = this.form.select( `#${ subItem.id }` ).node(),
            value = node ? node.value : null,
            key   = {};

        if ( !value || !value.length ) {
            value = subItem.defaultvalue;
        }

        let idx = results.indexOf( _.find( results, obj => obj.name === subItem.hoot_key ) );

        if ( subItem.hoot_key ) {
            if ( idx > -1 ) {
                if ( results[ idx ].value.indexOf( value ) === -1 ) {
                    // concat new value to existing string
                    results[ idx ].value += ';' + value;
                }
            } else {
                // add new entry
                key.name  = subItem.hoot_key;
                key.value = value;
                results.push( key );
            }
        }

        if ( subItem.hoot_val ) {
            if ( idx > -1 && results[ idx ].value.indexOf( value === -1 ) ) {
                // concat new value to existing string
                results[ idx ].value += ';' + subItem.hoot_val;
            } else {
                // add new entry
                key.name  = item.hoot_key;
                key.value = subItem.hoot_val;
                results.push( key );
            }
        }
    }
}