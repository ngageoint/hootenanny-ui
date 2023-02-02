import { interpolateRgb as d3_interpolateRgb } from 'd3-interpolate';

import { t } from '../util/locale';
import { modeSave } from '../modes';
import { svgIcon } from '../svg';
import { uiCmd } from './cmd';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiSave(context) {
    var history = context.history();
    var key = uiCmd('⌘S');


    function saving() {
        var mode = context.mode();
        return mode && mode.id === 'save';
    }


    function save(d3_event) {
        d3_event.preventDefault();
        if (!context.inIntro() && !saving() && history.hasChanges()) {
            context.enter(modeSave(context));
        }
    }


    function getBackground(numChanges) {
        var step;
        if (numChanges === 0) {
            return null;
        } else if (numChanges <= 50) {
            step = numChanges / 50;
            return d3_interpolateRgb('#fff', '#ff8')(step);  // white -> yellow
        } else {
            step = Math.min((numChanges - 50) / 50, 1.0);
            return d3_interpolateRgb('#ff8', '#f88')(step);  // yellow -> red
        }
    }


    return function(selection) {
        var numChanges = 0;

        function updateCount() {
            var _ = history.difference().summary().length;
            if (_ === numChanges) return;
            numChanges = _;

            tooltipBehavior
                .title(uiTooltipHtml(
                    t(numChanges > 0 ? 'save.help' : 'save.no_changes'), key)
                );

            var background = getBackground(numChanges);

            button
                .classed('disabled', numChanges === 0)
                .classed('has-count', numChanges > 0)
                .style('background', background);

            button.select('span.count')
                .text(numChanges);
        }


        var tooltipBehavior = tooltip()
            .placement('bottom')
            .html(true)
            .title(uiTooltipHtml(t('save.no_changes'), key));

        var button = selection
            .append('button')
            .attr('class', 'save disabled')
            .attr('tabindex', -1)
            .on('click', save)
            .call(tooltipBehavior);

        // added in HootOld to recalculate position of tooltip that is too close to edge of screen
        button.on( 'mouseover', function(d3_event) {
            let tagName = d3_event.target.tagName;

            if ( tagName !== 'BUTTON' || this.tooltipVisible ) return;

            // set timeout so that the other 'mouseover' event is executed first.
            // the tooltip completely render before trying to recalculating its position
            setTimeout( () => {
                let tooltip = d3.select( this ).select( '.tooltip' ),
                    padding = 40;

                let parentWidth = d3.select( '#content' ).node().offsetWidth,

                    buttonWidth    = this.clientWidth,
                    buttonLeft     = this.offsetLeft,
                    buttonRightPos = buttonLeft + buttonWidth,

                    tooltipWidth    = tooltip.node().clientWidth,
                    tooltipLeft     = tooltip.node().offsetLeft,
                    tooltipRightPos = tooltipLeft + tooltipWidth;

                let diff, left, arrowLeft;

                if ( tooltipRightPos <= parentWidth - padding ) {
                    // there's enough space for the tooltip to be centered below the button.
                    // reset the position of the tooltip.
                    diff = tooltipWidth - buttonWidth;
                    left = buttonLeft - ( diff / 2 );

                    tooltip
                        .style( 'left', left + 'px' )
                        .select( '.tooltip-arrow' )
                        .style( 'left', '50%' );

                    return;
                }

                // tooltip will overflow paste screen.
                // make the right-side edges of tooltip and button flushed with each other
                diff = tooltipRightPos - buttonRightPos;
                left = tooltipLeft - diff;
                arrowLeft = ( tooltipWidth - buttonWidth ) + ( buttonWidth / 2 );

                tooltip
                    .style( 'left', left + 'px' )
                    .select( '.tooltip-arrow' )
                    .style( 'left', arrowLeft + 'px' );
            }, 0 );
        } );

        let wrap = button
            .append( 'div' )
            .classed( 'label-wrap', true );

        wrap
            .call(svgIcon('#iD-icon-save'));

        wrap
            .append('span')
            .attr('class', 'label')
            .text(t('save.title'));

        button
            .append('span')
            .attr('class', 'count')
            .text('0');

        updateCount();


        context.keybinding()
            .on(key, save, true);

        context.history()
            .on('change.save', updateCount);

        context
            .on('enter.save', function() {
                button.property('disabled', saving());
                if (saving()) button.call(tooltipBehavior.hide);
            });
    };
}
