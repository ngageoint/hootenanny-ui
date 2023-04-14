/** ****************************************************************************************************
 * File: dgcarousel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/9/18
 *******************************************************************************************************/

import _debounce from 'lodash-es/debounce';

import { t, localizer }           from '../core/localizer';
import { uiCmd } from './cmd';
import { uiTooltip }   from './tooltip';
import { svgIcon }     from '../svg';

import { interpolateNumber as d3_interpolateNumber } from 'd3-interpolate';
import { select as d3_select }     from 'd3-selection';

export function uiDgCarousel( context ) {
    let key = t('dgcarousel.key'),
        dg = context.dgservices();

    let _pane = d3_select(null),
        _toggleButton = d3_select(null),
        _ul = d3_select(null),
        shown = false;

    function hidePane() {
        context.ui().togglePanes();
    }

    function hide() {
        setVisible( false );
    }

    function setVisible( show ) {
        if ( show !== shown ) {
            button.classed( 'active', show );
            shown = show;
            if ( show ) {
                selection.on( 'mousedown.carousel-inside', (d3_event) => d3_event.stopPropagation() );
                pane
                    .style( 'display', 'block' )
                    .style( 'right', '-200px' )
                    .transition()
                    .duration( 200 )
                    .style( 'right', '0px' );

                getImageMetadata();
            } else {
                pane
                    .style( 'display', 'block' )
                    .style( 'right', '0px' )
                    .transition()
                    .duration( 200 )
                    .style( 'right', '-200px' )
                    .on( 'end', function() {
                        d3_select( this ).style( 'display', 'none' );
                    } );

                selection.on( 'mousedown.carousel-inside', null );
            }
        }
    }

    function scrollTopTween( scrollTop ) {
        return function() {
            let i = d3_interpolateNumber( this.scrollTop, scrollTop );

            return t => {
                this.scrollTop = i( t );
            };
        };
    }

    function getImageMetadata() {
        //get zoom
        if ( context.map().zoom() > 13 ) {
            //get extent
            let extent = context.map().extent(),
                size   = context.map().dimensions();

            if ( extent && size ) {
                //get features from wfs
                let activeProfile = d3_select( '#dgProfiles' )
                    .selectAll( 'li.active' )
                    .property( 'value' );

                dg.wfs.getFeatureInRaster( null, activeProfile, extent, size, ( error, data ) => {
                    if ( error ) {
                        window.window.console.warn( error );
                    } else {
                        //Update dgservices letiables tracking visible image metadata
                        //The first feature in the response is the top (visible) image
                        //in the stacking profile.  Record this metadata.
                        dg.imagemeta.add( 'DigitalGlobe EV-WHS - ' + dg.getProfile( activeProfile ), data.features );
                    }
                } );

                dg.wfs.getFeature( null, activeProfile, extent, size, ( error, data ) => {
                    if ( error ) {
                        window.window.console.warn( error );
                    } else {
                        //window.window.console.log(data.totalFeatures);
                        //display available images in carousel

                        //remove image thumbnails already selected
                        let activeData    = ul.selectAll( 'li.active' ).data(),
                            availableData = data.features.filter( d => !(activeData.some( s => d.id === s.id )) );

                        let images = _ul
                            .selectAll( 'li:not(.active)' )
                            .data( availableData );

                        images
                            .enter()
                            .append( 'li' )
                            .classed( 'carousel-zoom-warn', false )
                            .html( d => formatImageMetadata( d ) )
                            .on( 'mouseenter', (d3_event, d) => loadFootprint( d3_event, d ) )
                            .on( 'mouseleave', (d3_event, d) => loadFootprint( d3_event, d ) )
                            .on( 'dblclick', (d3_event, d) => loadMetadataPopup( d3_event, d ) )
                            .on( 'click', function( d3_event, d ) {
                                let active = !d3_select( this ).classed( 'active' );

                                d3_select( this ).classed( 'active', active );
                                loadImage( d, active );
                            } );

                        images.exit().remove();

                    }
                } );
            }

        } else {
            let images = _ul
                .selectAll( 'li:not(.active)' )
                .data( [ { message: t( 'dgcarousel.zoom_warning' ) } ] );

            images
                .enter()
                .append( 'li' );

            images
                .classed( 'carousel-zoom-warn', true )
                .html( d => formatZoomWarning( d ) );

            images
                .exit()
                .remove();
        }
    }

    function formatImageMetadata( d ) {
        let imageDiv = '';

        imageDiv += '<div>' + d.properties.formattedDate + '</div>';
        imageDiv += '<span>' + d.properties.source + '</span>';
        imageDiv += '<span class=\'' + ((d.properties.colorBandOrder === 'RGB') ? 'dgicon rgb' : 'dgicon pan') + '\'></span>';

        return imageDiv;
    }

    function formatZoomWarning( d ) {
        let imageDiv = '';

        imageDiv += '<div class=\'carousel-zoom-warn\'>' + d.message + '</div>';

        return imageDiv;
    }

    function loadImage( d, active ) {
        let activeProfile = d3_select( '#dgProfiles' ).selectAll( 'li.active' ).property( 'value' ),
            template      = dg.wms.getMap( null, activeProfile, d.properties.featureId ),
            terms         = dg.terms();

        let source = {
            'name': d.properties.formattedDate + ', ' + d.properties.source,
            'type': 'wms',
            'description': d.properties.productType,
            'template': template,
            'scaleExtent': [
                0,
                20
            ],
            'polygon': [
                [
                    [
                        -180,
                        -90
                    ],
                    [
                        -180,
                        90
                    ],
                    [
                        180,
                        90
                    ],
                    [
                        180,
                        -90
                    ],
                    [
                        -180,
                        -90
                    ]
                ]
            ],
            'terms_url': terms,
            'terms_text': d.properties.copyright,
            'id': 'DigitalGlobe EV-WHS - ' + d.properties.featureId,
            'overlay': true
        };

        if ( active ) {
            context.background().addSource( source );
            //Add image to dg.imagemeta
            dg.imagemeta.add( source.id, [ d ] );
        } else {
            context.background().removeSource( source.id );
            //Remove image from dg.imagemeta
            dg.imagemeta.remove( source.id );
        }
    }

    function loadMetadataPopup( d3_event, data ) {
        if ( d3_event ) d3_event.preventDefault();

        popup.classed( 'hide', false );

        let metarows = metatable
            .selectAll( 'tr' )
            .data( Object.entries( data.properties ) );

        metarows
            .enter()
            .append( 'tr' )
            .attr( 'class', 'carousel-metadata-table' );

        metarows
            .exit()
            .remove();

        let metacells = metarows
            .selectAll( 'td' )
            .data( ([key, value]) => Object.values( value ) );

        metacells
            .enter()
            .append( 'td' );

        metacells
            .attr( 'class', 'carousel-metadata-table' )
            .text( d => d );

        metacells
            .exit()
            .remove();
    }

    function loadFootprint( d3_event, d ) {
        if ( d3_event ) d3_event.preventDefault();

        if ( d3_event.type === 'mouseover' || d3_event.type === 'mouseenter' ) {
            context.background().updateFootprintLayer( d.geometry );
        } else {
            context.background().updateFootprintLayer( {} );
        }
    }

    var popup = d3_select('div.over-map')
        .append('div')
        .attr('class', 'carousel-popup hide');

    var metatable = popup.append('div')
        .attr('class', 'carousel-metadata')
        .append('table')
        .attr('class', 'carousel-metadata-table');

    var paneTooltip = uiTooltip()
        .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
        .title(t('dgcarousel.description'), key);


    uiDgCarousel.togglePane = function (d3_event) {
        if ( d3_event ) d3_event.preventDefault();
        paneTooltip.hide(_toggleButton);
        setVisible( !button.classed( 'active' ) );
    }

    uiDgCarousel.renderToggleButton = function (selection) {
        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiDgCarousel.togglePane)
            .call(svgIcon('#iD-icon-carousel', 'light'))
            .call(paneTooltip);
    };

    uiDgCarousel.renderPane = function (selection) {

        _pane = selection
            .append( 'div' )
            .attr( 'class', 'fill-white carousel-column content hide' )
            .attr('pane', 'dgcarousel');

        var heading = _pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('dgcarousel.title'));

        heading
            .append('button')
            .on('click', hidePane)
            .call(svgIcon('#iD-icon-close'));
        
        var content = _pane
            .append('div')
            .attr('class', 'pane-content');

        content
            .append( 'div' )
            .attr( 'class', 'dgarrow up' )
            .on( 'click', function() {
                let scrollable   = d3_select( '#dgCarouselThumbnails' ),
                    clientheight = scrollable.property( 'clientHeight' ),
                    scrolltop    = scrollable.property( 'scrollTop' );

                scrollable
                    .transition()
                    .duration( 1500 )
                    .tween( 'uniquetweenname', scrollTopTween( scrolltop - clientheight ) );
            } );

        let metadiv = _pane
            .append( 'div' )
            .attr( 'id', 'dgCarouselThumbnails' )
            .attr( 'class', 'carousel-thumbnails' );

        _pane
            .append( 'div' )
            .attr( 'class', 'dgarrow down' )
            .on( 'click', function() {
                let scrollable   = d3_select( '#dgCarouselThumbnails' ),
                    clientheight = scrollable.property( 'clientHeight' ),
                    scrolltop    = scrollable.property( 'scrollTop' );

                scrollable
                    .transition()
                    .duration( 1500 )
                    .tween( 'uniquetweenname', scrollTopTween( scrolltop + clientheight ) );
            } );

        _ul = metadiv
            .append( 'ul' )
            .attr( 'class', 'carousel-metadata-list' );

        context.map()
            .on( 'move.carousel-update', _debounce( getImageMetadata, 1000 ) );

        context.background()
            .on( 'baseLayerChange.carousel-update', _debounce( getImageMetadata, 1000 ) );

        context.keybinding()
            .on(uiCmd(key), uiDgCarousel.togglePane)

        context.container().on( 'mousedown.carousel-outside', hide );
    }

    return uiDgCarousel;
}
