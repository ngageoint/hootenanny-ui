export default class Filtering {
    constructor(container) {
        this.container = container;

    }

    render(data) {
        let that = this;

        function bindSingleBodyClick() {
            d3.select( 'body' ).on( 'click', () => {
                d3.selectAll('div.filter-column').remove();
                //send updated filter to container
                updateFilter();
                d3.select( 'body' ).on('click', null);
            });
        }

        function updateFilter() {
            let filterValues = filter.selectAll('input[type=checkbox]:checked').nodes()
                .map(function(d) {
                    return d.value;
                }).join(',');

            that.container.setFilter(data.column, filterValues);
        }

        bindSingleBodyClick();

        let filter = d3.select('body')
            .append('div')
            .classed('filter-column', true)
            .style('top', d3.event.pageY + 'px')
            .style('left', d3.event.pageX + 'px')
            .on('click', () => {
                d3.event.stopPropagation();
            });

        filter.append('h3')
            .text(`Filter ${data.label}`);

        let vals = filter.append('ul')
            .selectAll('li')
            .data(data.values)
            .enter()
            .append('li')
            .classed('filter-value', true);
        let checks = vals.append('input')
            .attr('type', 'checkbox')
            .attr('id', d => d.key)
            .property('checked', d => data.selected && data.selected.includes(d.key))
            .property('value', d => d.key); //.key is the enum string, .value is the icon

        let labs = vals.append('label')
            .attr('for', d => d.key );
        labs.append('i')
            .classed('material-icons', true)
            .text(d => d.value);
        labs.append('span')
            .text(d => d.key.toUpperCase());

    }

}