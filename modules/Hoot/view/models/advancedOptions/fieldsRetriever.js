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
        let conflateType  = d3.select( '#conflateType' ).node().value,
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
                replaceItems = _.filter( overrideKeys, key => _.includes( memberIds, key.id ) );

            _.forEach( replaceItems, item => {
                let match = _.find( item.members, { id: item.id } );

                match.defaultvalue = item.defaultvalue;
                match.required     = item.required;
            } );

            _.forEach( item.members, innerItem => {
                if ( innerItem.members && innerItem.members.length ) {
                    innerItem.members = this.mergeWithBase( innerItem.members, overrideKeys );
                }
            } );
        } );

        return members;
    }
}