import Tab          from './tab';

/**
 * Creates the tasking manager tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class TaskingManagerPanel extends Tab {
    constructor( instance ) {
        super( instance );

        this.name = 'Tasking Manager';
        this.id   = 'taskingManagerPanel';
    }

    render() {
        super.render();
        this.createProjectsTable();

        // fire off the request but don't wait for it so we don't hold up the UI from being rendered
        this.projectList = Hoot.api.getTMProjects();

        return this;
    }

    async activate() {
        // await for the list
        this.projectList = await this.projectList;

        this.loadProjectsTable( this.projectList.features );
    }

    createProjectsTable() {
        this.panelWrapper
            .append( 'h3' )
            .classed( 'taskingManager-projects', true )
            .text( 'Tasking Manager Projects' );

        this.taskingManagerTable = this.panelWrapper
            .append( 'div' )
            .classed( 'taskingManager-table keyline-all', true )
            .append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    loadProjectsTable( projects ) {
        let items = this.taskingManagerTable
            .selectAll( '.taskingManager-item' )
            .data( projects );

        items
            .exit()
            .transition()
            .duration( 400 )
            .style( 'opacity', 0 )
            .remove();

        items = items
            .enter()
            .append( 'div' )
            .attr( 'id', d => d.id )
            .classed( 'taskingManager-item fill-white keyline-bottom', true )
            .style( 'opacity', 0 );

        items
            .transition()
            .duration( 400 )
            .style( 'opacity', 1 );

        let wrapper = items
            .append( 'div' )
            .classed( 'taskingManager-wrapper', true );

        let header = wrapper
            .append( 'div' )
            .classed( 'taskingManager-header flex justify-between align-center', true );
console.log(projects);
        header
            .append( 'div' )
            .classed( 'taskingManager-title', true )
            .append( 'a' )
            .text( project => project.properties.name )
            .on( 'click', project => {
                console.log(project)
                // this.openTask( project )
            } );

        let body = wrapper
            .append( 'div' )
            .classed( 'taskingManager-body', true );

        let description = body
            .append( 'div' )
            .classed( 'taskingManager-description', true );

        description
            .append( 'label' )
            .text( 'Description:' );

        description
            .append( 'span' )
            .text( project => project.properties.short_description );

        let details = body
            .append( 'div' )
            .classed( 'taskingManager-details', true );

        details
            .append( 'label' )
            .text( 'Created At: ' );

        details
            .append( 'span' )
            .text( project => {
                let { created, author } = project.properties;
                created = new Date( created ).toLocaleString();

                return `${ created } by ${ author }`;
            } );
    }

}

