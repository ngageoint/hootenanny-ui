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
            .selectAll('div.admin-table')
            .data([0]);
        var userInfoTableEnter = this.userInfoTable.enter().append( 'div' )
            .classed( 'admin-table keyline-all fill-white', true );

        let table = userInfoTableEnter
            .append('table');

        table.append('thead')
            .append('tr')
            .selectAll('th')
            .data( this.adminTableHeaders )
            .enter()
            .append('th')
            .attr( 'style', d => `width: ${ d.width }` )
            .text( d => d.title );

        table.append( 'tbody' );

        this.userInfoTable = this.userInfoTable.merge(userInfoTableEnter);
        this.table = this.userInfoTable.selectAll('table');

        let tbody = this.userInfoTable.selectAll('tbody');
        let rows = tbody.selectAll( 'tr' )
            .data( users );

        let rowsEnter = rows.enter()
            .append( 'tr' )
            .classed( 'user-item', true );
        rows.exit().remove();
        rows = rows.merge(rowsEnter)
            .classed('modified', false); //reset modified marker class

        let tds = rows.selectAll( 'td' )
            .data( d => [
                    d.display_name,
                    d.last_authorized || 'N/A',
                    d.privileges
                ] );
        tds.exit().remove();
        let tdsEnter = tds.enter()
            .append( 'td' );
        tds.merge(tdsEnter)
            .each(function(d, i) {
                // console.log(d);
                // console.log(i);
                // console.log(this);
                let datum = d;
                let content;
                switch (i) {
                    case 0:
                    default:
                        content = d3.select(this).selectAll('span')
                            .data(d => [d]);
                        content.exit().remove();
                        content.enter().append('span')
                            .merge(content)
                            .text(d => d);
                        break;
                    case 1:
                        content = d3.select(this).selectAll('span')
                            .data(d => [d]);
                        content.exit().remove();
                        content.enter().append('span')
                            .merge(content)
                            .text(d => {
                                return isNaN(d) ? d : duration( d, Date.now(), true );
                            });
                        break;
                    case 2:
                        d3.select(this).classed( 'privileges', true )
                            .style( 'display', 'inline-flex' );

                        content = d3.select(this).selectAll('label')
                            .data(privilegeOptions);
                        content.exit().remove();
                        let labelEnter = content.enter().append( 'label' )
                            .text( d => d );
                        labelEnter.append('input')
                            .attr( 'type', 'checkbox' );
                        content = content.merge(labelEnter);
                        content.selectAll('input')
                            .attr( 'id', d => d )
                            .property( 'checked', d => datum[d] === 'true' )
                            .on('click', () => {
                                //mark the user row as modified
                                d3.select( this.parentElement ).classed('modified', true);
                            });
                        break;
                }
            });
    }

    submitPrivileges() {
        let userList = [];

        this.table.selectAll( '.user-item.modified' ).each( function(data) {
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
            .then( ( resp ) => {
                this.populateAdminPanel();
                Hoot.message.alert( resp );
            } )
            .catch( err => Hoot.message.alert( err ) );

    }

}

