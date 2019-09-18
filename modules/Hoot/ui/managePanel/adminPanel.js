import Tab          from './tab';
import { duration } from '../../tools/utilities';

/**
 * Creates the admin tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class AdminPanel extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Admin';
        this.id   = 'util-adminPanel';

        this.adminPanelButtons = [
            {
                title: 'Save',
                icon: 'save'
            },
            {
                title: 'Refresh',
                icon: 'refresh'
            }
        ];

        this.adminTableHeaders = [
            {
                title: 'Display Name',
                name: 'displayName',
                width: '9%'
            },
            {
                title: 'Last Authorized',
                name: 'lastAuthorized',
                width: '9%'
            },
            {
                title: 'Privileges',
                name: 'privileges',
                width: '20%'
            }
        ];
    }

    async render() {
        super.render();

        this.createButtons();
        this.populateAdminPanel();

        return this;
    }

    createButtons() {
        let buttonContainer = this.panelWrapper
            .append( 'div' )
            .classed( 'admin-buttons flex', true )
            .selectAll( 'button.admin-action-button' )
            .data( this.adminPanelButtons );

        let buttons = buttonContainer.enter()
            .append( 'button' )
            .classed( 'admin-action-button primary text-light flex align-center', true )
            .on( 'click', async button => {
                d3.event.preventDefault();

                if ( button.title === 'Save' ) {
                    this.submitPrivileges();
                }
            } );

        buttons.append( 'i' )
            .attr( 'class', d => d.iconClass )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        buttons.append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );
    }

    async populateAdminPanel() {
        const users = await Hoot.api.getAllUsers(),
              privilegeOptions = await Hoot.api.getPrivilegeOptions();

        this.userInfoTable = this.panelWrapper
            .append( 'div' )
            .classed( 'admin-table keyline-all fill-white', true );

        this.table = this.userInfoTable
            .append('table');

        this.table.append('thead')
            .append('tr')
            .selectAll('th')
            .data( this.adminTableHeaders )
            .enter()
            .append('th')
            .attr( 'style', d => `width: ${ d.width }` )
            .text( d => d.title );

        let tbody = this.table.append( 'tbody' );

        let rows = tbody.selectAll( 'tr' )
            .data( users )
            .enter()
            .append( 'tr' )
            .classed( 'user-item', true );

        rows.selectAll( 'td' )
            .data( this.adminTableHeaders )
            .enter()
            .append( 'td' )
            .select( function( columnItem ) {
                const user = d3.select( this.parentElement ).data()[0];
                const currentElement = d3.select( this );

                if ( columnItem.name === 'displayName' ) {
                    currentElement.append( 'span' )
                        .text(user.display_name);
                } else if ( columnItem.name === 'lastAuthorized' ) {
                    const timeSinceAuth = user.last_authorized ? duration( user.last_authorized, Date.now(), true ) : 'N/A';

                    currentElement.append( 'span' )
                        .text( timeSinceAuth );
                } else if ( columnItem.name === 'privileges' ) {
                    currentElement.classed( 'privileges', true )
                        .style( 'display', 'inline-flex' );

                    privilegeOptions.forEach( key => {
                        currentElement.append( 'input' )
                            .attr( 'type', 'checkbox' )
                            .attr( 'id', key )
                            .property( 'checked', user.privileges[key] === 'true' );

                        currentElement.append( 'label' )
                            .text( key );
                    });
                }
            } );
    }

    submitPrivileges() {
        let userList = [];

        this.table.selectAll( '.user-item' ).each( function(data) {
            const user = {
                id: data.id,
                privileges: {}
            };

            d3.select( this ).select( '.privileges' )
                .selectAll( 'input' )
                .each( function() {
                    const currentElement = d3.select( this );
                    user.privileges[ currentElement.attr('id') ] = currentElement.property( 'checked');
                });

            userList.push(user);
        } );

        Hoot.api.savePrivileges( userList )
            .then( ( resp ) => Hoot.message.alert( resp ) )
            .catch( err => Hoot.message.alert( err ) );

    }

}

