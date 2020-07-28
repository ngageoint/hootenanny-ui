import EventEmitter from 'events';

export default class Events extends EventEmitter {
    constructor() {
        super();
        this.functionsObj = {};
    }

    getFunction( className, eventName ) {
        if ( this.functionsObj[eventName] && this.functionsObj[eventName].srcClass === className ) {
            return this.functionsObj[eventName].func;
        }
        return null;
    }

    // Need the class name as a primary key and eventName is the name of the event
    // There can be a case where the same event eventName is used in more than 1 class
    listen( className, eventName, fn ) {
        let func = this.getFunction( className, eventName );
        if ( func ) {
            super.removeListener( eventName, func );
        }

        this.functionsObj[ eventName ] = {
            srcClass: className,
            func: fn
        };

        super.on(eventName, fn);
    }

    on(string, fn) {
        console.warn('function should likely be run through events.listen');
        super.on(string, fn);
    }

}
