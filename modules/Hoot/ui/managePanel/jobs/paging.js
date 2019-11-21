import { d3combobox } from '../../../../lib/hoot/d3.combobox';

export default class Paging {
    constructor(container) {
        this.container = container

    }

    forwardPage(that) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        that.setPage(+that.pageElement.text() + 1);
    }

    backPage(that) {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        that.setPage(+that.pageElement.text() - 1);
    }

    setPage(p) {
        if (p > 0 && p <= this.container.getPages()) {
            this.pageElement.text(p);
            this.container.setPage(p);
        }
    }

    render(selection) {
        let that = this;

        selection.append('i')
            .classed('page material-icons', true)
            .text('arrow_left')
            .on('click', () => this.backPage(that));

        this.pageElement = selection.append('span')
            .text('1')
            .on('click', () => {

            });

        selection.append('i')
            .classed('page material-icons', true)
            .text('arrow_right')
            .on('click', () => this.forwardPage(that));

        this.ofElement = selection.append('span')
            .classed('pages', true)
            .on('contextmenu', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                function bindSingleBodyClick() {
                    d3.select( 'body' ).on( 'click', () => {
                        d3.selectAll('div.limit-value').remove();
                        //send updated filter to container
                        updateLimit();
                        d3.select( 'body' ).on('click', null);
                    });
                }

                function updateLimit() {
                    that.container.setLimit(pagesize.property('value'));
                }

                bindSingleBodyClick();

                let filter = d3.select('body')
                    .append('div')
                    .classed('limit-value', true)
                    .style('top', d3.event.pageY + 'px')
                    .style('right', (window.innerWidth - d3.event.pageX) + 'px')
                    .on('click', () => {
                        d3.event.stopPropagation();
                    });

                filter.append('h3')
                    .text('Page Size');

                let combobox = d3combobox()
                    .data([25, 50, 100].map(d => {
                        return {value: d, title: d};
                    }));

                let pagesize = filter.append('input')
                    .attr('type', 'number')
                    .property('value', this.container.params.limit)
                    .call( combobox );


            });

    }

    updatePages() {
        this.ofElement.text('of ' + this.container.getPages());
    }
}