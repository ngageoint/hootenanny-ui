export default class UserManager {
    getNameForId(id) {
        return (Hoot.config.users[ id ]) ?
            Hoot.config.users[ id ].display_name :
            'No user for ' + id;
    }
}
