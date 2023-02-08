export default class Filtering {
    constructor(container) {
        this.container = container;

    }

    render(d3_event, data) {
        let that = this;

        function bindSingleBodyClick() {
            d3.select( 'body' ).on( 'click', () => {
                d3.selectAll('div.filter-column').remove();
                //send updated filter to container
                d3.select( 'body' ).on('click', null);
            });
        }

        function updateFilter() {
            let filterValues = filter.selectAll('input[type=checkbox]:checked').nodes()
                .map(function([key, value]) {
                    return value;
                }).join(',');

            that.container.setFilter(data.column, filterValues);
        }

        bindSingleBodyClick();

        let filter = d3.select('body')
            .append('div')
            .classed('filter-column', true)
            .style('top', d3_event.pageY + 'px')
            .style('left', d3_event.pageX + 'px')
            .on('click', (d3_event) => {
                d3_event.stopPropagation();
            });

        filter.append('h3')
            .text(`Filter ${data.label}`);

        let vals = filter.append('ul')
            .selectAll('li')
            .data(data.values)
            .enter()
            .append('li')
            .classed('filter-value', true);
        vals.append('input')
            .attr('type', 'checkbox')
            .attr('id', ([key, value]) => key)
            .property('checked', ([key, value]) => data.selected && data.selected.includes(d.key))
            .property('value', ([key, value]) => key) //key is the enum string, value is the icon
            .on('click', updateFilter);
        let labs = vals.append('label')
            .attr('for', ([key, value]) => key );
        labs.append('i')
            .classed('material-icons', true)
            .text(([key, value]) => value);
        labs.append('span')
            .text(([key, value]) => key.toUpperCase());

    }

}