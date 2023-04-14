import { d3combobox } from '../../d3.combobox';
import { select as d3_select } from 'd3-selection';

export default class Paging {
    constructor(container) {
        this.container = container;

    }

    forwardPage(d3_event, that) {
        d3_event.stopPropagation();
        d3_event.preventDefault();

        that.setPage(+that.pageElement.text() + 1);
    }

    backPage(d3_event, that) {
        d3_event.stopPropagation();
        d3_event.preventDefault();

        that.setPage(+that.pageElement.text() - 1);
    }

    getCurrentPage() {
        return Number( this.pageElement.text() );
    }

    setPage(p) {
        if (p > 0 && p <= this.container.getPages()) {
            this.pageElement.text(p);
            this.container.setPage(p);
        }
    }

    render(selection) {
        let that = this;

        selection.on('contextmenu', contextMenu);

        selection.append('i')
            .classed('page material-icons', true)
            .text('arrow_left')
            .on('click', () => this.backPage(that));

        this.pageElement = selection.append('span')
            .text('1');

        selection.append('i')
            .classed('page material-icons', true)
            .text('arrow_right')
            .on('click', () => this.forwardPage(that));

        function contextMenu(d3_event) {
            d3_event.stopPropagation();
            d3_event.preventDefault();

            function bindSingleBodyClick() {
                d3_select( 'body' ).on( 'click', () => {
                    d3_selectAll('div.limit-value').remove();
                    //send updated filter to container
                    updateLimit();
                    d3_select( 'body' ).on('click', null);
                });
            }

            function updateLimit() {
                that.container.setLimit(pagesize.property('value'));
            }

            bindSingleBodyClick();

            let filter = d3_select('body')
                .append('div')
                .classed('limit-value', true)
                .style('top', d3_event.pageY + 'px')
                .style('right', (window.innerWidth - d3_event.pageX) + 'px')
                .on('click', (d3_event) => {
                    d3_event.stopPropagation();
                });

            filter.append('h3')
                .text('Page Size');

            let combobox = d3combobox()
                .data([25, 50, 100].map(d => {
                    return {value: d, title: d};
                }));

            let pagesize = filter.append('input')
                .attr('type', 'number')
                .property('value', that.container.params.limit)
                .call( combobox );

        }

        this.ofElement = selection.append('span')
            .classed('pages', true);

    }

    updatePages() {
        this.ofElement.text('of ' + this.container.getPages());
    }
}
