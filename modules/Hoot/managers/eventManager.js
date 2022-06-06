import EventEmitter from 'events';

export default class Events extends EventEmitter {
    constructor() {
        super();
        this.functionsObj = {};
    }

    getFunction( identifier, eventName ) {
        if ( this.functionsObj[eventName] && this.functionsObj[eventName].srcIdentifier === identifier ) {
            return this.functionsObj[eventName].func;
        }
        return null;
    }

    // Need the class name as a primary key and eventName is the name of the event
    // There can be a case where the same event eventName is used in more than 1 class
    listen( identifier, eventName, fn ) {
        let func = this.getFunction( identifier, eventName );
        if ( func ) {
            super.removeListener( eventName, func );
        }

        this.functionsObj[ eventName ] = {
            srcIdentifier: identifier,
            func: fn
        };

        super.on(eventName, fn);
    }

    on(string, fn) {
        console.warn('function should likely be run through events.listen');
        super.on(string, fn);
    }

}
