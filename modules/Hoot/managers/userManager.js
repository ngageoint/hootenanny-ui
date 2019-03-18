export default class UserManager {
    constructor () {
    }

    getNameForId(id) {
        return (Hoot.config.users[ id ]) ?
            Hoot.config.users[ id ].display_name :
            'No user for ' + id;
    }
}
