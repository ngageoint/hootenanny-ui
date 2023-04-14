import FormFactory from '../../tools/formFactory';
import { select as d3_select } from 'd3-selection';

export default class deleteStaleMaps {
    constructor( months ) {
        this.months = months;
    }

    render() {
        let metadata = {
            title: 'Delete these stale map datasets?',
            form: [
                {
                    label: 'Yes, I really want to do this.',
                    inputType: 'checkbox',
                    checkbox: 'cboxDeleteStale',
                    onChange: () => this.confirmDelete()
                }
            ],
            button: {
                text: 'Delete',
                id: 'deleteStale',
                onClick: () => this.handleDelete()
            }
        };

        let formId = 'deleteStaleMaps';
        this.form  = new FormFactory().generateForm( 'body', formId, metadata );
        this.submitButton = d3_select( `#${ metadata.button.id }` );

        this.loadSummary();

    }

    confirmDelete() {
        let toggle = (this.submitButton.attr('disabled') != null) ? null : true;
        this.submitButton
            .attr('disabled', toggle);
    }

    async loadSummary() {
        let summary = await Hoot.api.getStaleLayers(this.months);

        let data = Object.keys(summary).map(d => {
            return [d, summary[d]];
        });

        let tableElement = this.form
            .select( 'form' )
            .insert('table', 'fieldset')
            .classed('deleteStaleInfo', true);

        let thead = tableElement.append('thead');
        let tbody = tableElement.append('tbody');

        const columns = ['user', 'count'];
        thead.append('tr')
            .selectAll('th')
            .data(columns)
            .enter()
            .append('th')
            .text( d => d);

        let rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr');

        rows.selectAll('td')
            .data(d => d)
            .enter()
            .append('td')
            .classed( 'strong', true )
            .text( d => d );

    }

    handleDelete() {

        Hoot.api.deleteStaleLayers( this.months )
            .then( () => Hoot.layers.refreshLayers() )
            .then( () => Hoot.events.emit( 'render-dataset-table' ) )
            .then( resp => Hoot.message.alert( {
                message: 'Deleting stale map datasets complete.',
                type: 'success'
            } ) )
            .catch( err => {
                Hoot.message.alert( err );
                return false;
            } );

        this.form.remove();
    }

}
