export default class UserManager {
    constructor() {
        this.privs = {};
    }

    async init() {
        this.privs = await Hoot.api.getPrivileges();
    }

    isAdmin() {
        return this.privs.admin === 'true';
    }

    isAdvanced() {
        return this.privs.advanced === 'true';
    }

    getNameForId(id) {
        return (Hoot.config.users[ id ]) ?
            Hoot.config.users[ id ].display_name :
            'No user for ' + id;
    }
}
