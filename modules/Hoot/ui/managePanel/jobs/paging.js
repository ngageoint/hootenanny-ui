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
            .on('click', () => {

            });

    }

    updatePages() {
        this.ofElement.text('of ' + this.container.getPages());
    }
}