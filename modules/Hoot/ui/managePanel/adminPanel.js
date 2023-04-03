import Tab          from './tab';
import { duration } from '../../tools/utilities';
import Filtering from './jobs/filtering';
import { d3combobox } from '../d3.combobox';
import deleteStaleMaps from '../modals/deleteStaleMaps';

/**
 * Creates the admin tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class AdminPanel extends Tab {
    constructor( instance ) {
        super( instance );
        this.filtering = new Filtering(this);

        this.name = 'Admin';
        this.id   = 'util-adminPanel';
        this.params = {
            sort: '+name',
            privileges: null
        };

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
                width: '9%',
                sort: 'name'
            },
            {
                title: 'Last Authorized',
                name: 'lastAuthorized',
                width: '9%',
                sort: 'auth'
            },
            {
                title: 'Privileges',
                name: 'privileges',
                width: '20%',
                filter: true
            }
        ];

        this.columnFilters = {
            privileges: Hoot.config.privilegeIcons
        };
    }

    async render() {
        super.render();


        this.panelWrapper
            .append( 'h3' )
            .classed( 'users', true )
            .text( 'User Accounts/Privileges' );

        this.createButtons();
        this.populateAdminPanel();

        this.panelWrapper
            .append( 'h3' )
            .classed( 'maps', true )
            .text( 'Delete Stale Map Datasets' );
        this.createOldData();

        return this;
    }

    createOldData() {
        let monthOptions = ['one', 'two', 'three', 'four', 'five', 'six'].map((d, i) => {
            return {value: `${d} month${(d === 'one') ? '' : 's'} ago`, _value: i+1};
        });

        this.panelWrapper.append('span')
            .classed('lastAccessed', true)
            .text('Last accessed over ');
        let months = this.panelWrapper
            .append( 'input' )
            .classed('lastAccessed', true)
            .attr( 'type', 'text' )
            .attr( 'readonly', true )
            .call(d3combobox().data(monthOptions.reverse()))
            .on('change', async () => {
                buttons.classed('disabled', false);
            });

        let buttonContainer = this.panelWrapper
            .append( 'div' )
            .classed( 'admin-buttons flex', true )
            .selectAll( 'button.admin-action-button' )
            .data( [{
                title: 'Delete',
                icon: 'delete_sweep'
            }] );

        let buttons = buttonContainer.enter()
            .append( 'button' )
            .classed( 'admin-action-button primary text-light flex align-center disabled', true )
            .on( 'click', (d3_event) => {
                d3_event.preventDefault();
                let m = months.attr('_value');
                this.deleteStale = new deleteStaleMaps(m);
                this.deleteStale.render();

                Hoot.events.once( 'modal-closed', () => {
                    delete this.deleteStale;
                });
            } );

        buttons.append( 'i' )
            .attr( 'class', d => d.iconClass )
            .classed( 'material-icons', true )
            .text( d => d.icon );

        buttons.append( 'span' )
            .classed( 'label', true )
            .text( d => d.title );

    }

    setFilter(column, values) {
        this.params[column] = values;
        this.populateAdminPanel();
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
            .on( 'click', async (d3_event, button) => {
                d3_event.preventDefault();

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
        const self = this;

        this.userInfoTable = this.panelWrapper
            .selectAll('div.admin-table')
            .data([0]);
        var userInfoTableEnter = this.userInfoTable.enter().append( 'div' )
            .classed( 'admin-table keyline-all fill-white', true );

        let table = userInfoTableEnter
            .append('table');

        let head = table.append('thead')
            .append('tr')
            .selectAll('th')
            .data( this.adminTableHeaders )
            .enter()
            .append('th')
            .attr( 'style', d => `width: ${ d.width }` )
            .text( d => d.title )
            .classed('sort', d => d.sort)
            .classed('filter', d => this.columnFilters[d.column])
            .on('click', d => {
                if (d.sort) {
                    let dir = (this.params.sort || '').slice(0,1),
                        col = (this.params.sort || '').slice(1);

                    if (col === d.sort) {
                        this.params.sort = ((dir === '+') ? '-' : '+') + col;
                    } else {
                        this.params.sort = '+' + d.sort;
                    }

                    this.populateAdminPanel();
                }
            })
            .on('contextmenu', openFilter);

        function openFilter(d3_event, d) {
            d3_event.stopPropagation();
            d3_event.preventDefault();

            if (d.filter) {
                let filterData = {
                    label: d.name[0].toUpperCase() + d.name.slice(1).split(/(?=[A-Z])/).join(' '),
                    column: d.name,
                    selected: self.params[d.name],
                    values: Object.entries( self.columnFilters[d.name] )
                };

                self.filtering.render(d3_event, filterData);
            }
        }

        head.each(function(d) {
            if ( d.filter ) {
                d3.select(this).append('i')
                    .classed( 'filter material-icons', true )
                    .text('menu_open')
                    .on('click', openFilter);
            }
        });

        head.append('i')
            .classed( 'sort material-icons', true );

        this.userInfoTable = this.userInfoTable.merge(userInfoTableEnter);

        this.userInfoTable.selectAll('i.sort')
            .text(d => {
                let dir = (this.params.sort || '').slice(0,1),
                    col = (this.params.sort || '').slice(1);

                if (col === d.sort) {
                    return ((dir === '+') ? 'arrow_drop_down' : 'arrow_drop_up');
                }
                return '';
            })
        .attr('title', 'sort');

        table.append( 'tbody' );

        this.table = this.userInfoTable.selectAll('table');

        const users = await Hoot.api.getAllUsers(this.params);

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
                let datum = d;
                let content, labelEnter;
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
                            .data( Object.keys( Hoot.config.privilegeIcons ) );
                        content.exit().remove();
                        labelEnter = content.enter().append( 'label' )
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

