/** ****************************************************************************************************
 * File: dgcarousel.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 10/9/18
 *******************************************************************************************************/

import _debounce from 'lodash-es/debounce';

import { t }           from '../core/localizer';
import { uiTooltip }     from '../ui/tooltip';
import { tooltipHtml } from '../Hoot/tools/utilities';
import { svgIcon }     from '../svg';

import { utilKeybinding } from '../util';

export function uiDgcarousel( context ) {
    let key = '⌘I',
        dg = context.dgservices();

    function dgcarousel( selection ) {
        let shown = false;

        function hide() {
            setVisible( false );
        }

        function toggle(d3_event) {
            if ( d3_event ) d3_event.preventDefault();

            ttp.hide( button );

            setVisible( !button.classed( 'active' ) );
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
                            d3.select( this ).style( 'display', 'none' );
                        } );

                    selection.on( 'mousedown.carousel-inside', null );
                }
            }
        }

        function scrollTopTween( scrollTop ) {
            return function() {
                let i = d3.interpolateNumber( this.scrollTop, scrollTop );

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
                    let activeProfile = d3.select( '#dgProfiles' )
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

                            let images = ul
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
                                    let active = !d3.select( this ).classed( 'active' );

                                    d3.select( this ).classed( 'active', active );
                                    loadImage( d, active );
                                } );

                            images.exit().remove();

                        }
                    } );
                }

            } else {
                let images = ul
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
            let activeProfile = d3.select( '#dgProfiles' ).selectAll( 'li.active' ).property( 'value' ),
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

        let pane = selection
            .append( 'div' )
            .attr( 'class', 'fill-white carousel-column content hide' );

        pane
            .append( 'div' )
            .attr( 'class', 'dgarrow up' )
            .on( 'click', function() {
                let scrollable   = d3.select( '#dgCarouselThumbnails' ),
                    clientheight = scrollable.property( 'clientHeight' ),
                    scrolltop    = scrollable.property( 'scrollTop' );

                scrollable
                    .transition()
                    .duration( 1500 )
                    .tween( 'uniquetweenname', scrollTopTween( scrolltop - clientheight ) );
            } );

        let metadiv = pane
            .append( 'div' )
            .attr( 'id', 'dgCarouselThumbnails' )
            .attr( 'class', 'carousel-thumbnails' );

        pane
            .append( 'div' )
            .attr( 'class', 'dgarrow down' )
            .on( 'click', function() {
                let scrollable   = d3.select( '#dgCarouselThumbnails' ),
                    clientheight = scrollable.property( 'clientHeight' ),
                    scrolltop    = scrollable.property( 'scrollTop' );

                scrollable
                    .transition()
                    .duration( 1500 )
                    .tween( 'uniquetweenname', scrollTopTween( scrolltop + clientheight ) );
            } );

        let ul = metadiv
            .append( 'ul' )
            .attr( 'class', 'carousel-metadata-list' );

        let ttp = uiTooltip()
            .title(() => (selection) => 
                selection.html(tooltipHtml( t( 'dgcarousel.title' ), key ) ));

        let button = selection
            .append( 'button' )
            .attr( 'tabindex', -1 )
            .on( 'click', toggle )
            .call( svgIcon( '#iD-icon-carousel', 'light' ) )
            .call( ttp );

        button
            .append( 'span' )
            .attr( 'class', 'icon dgcarousel light' );

        context.map()
            .on( 'move.carousel-update', _debounce( getImageMetadata, 1000 ) );

        context.background()
            .on( 'baseLayerChange.carousel-update', _debounce( getImageMetadata, 1000 ) );

        let keybinding = utilKeybinding( 'dgcarousel' )
            .on( key, toggle );

        d3.select( document )
            .call( keybinding );

        context.container().on( 'mousedown.carousel-outside', hide );

        let popup = d3.select( '#content' )
            .append( 'div' )
            .attr( 'class', 'carousel-popup hide' );

        let metaheader = popup.append( 'div' );

        metaheader
            .append( 'span' )
            .append( 'label' )
            .text( t( 'dgcarousel.popup_title' ) )
            .attr( 'class', 'carousel-popup' );

        metaheader
            .append( 'span' )
            .attr( 'class', 'carousel-close' )
            .append( 'button' )
            .attr( 'class', 'icon close dark' )
            .on( 'click', () => popup.classed( 'hide', true ) )
            .on( 'mousedown', (d3_event) => {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            } );

        let metatable = popup
            .append( 'div' )
            .attr( 'class', 'carousel-metadata' )
            .append( 'table' )
            .attr( 'class', 'carousel-metadata-table' );

    }

    return dgcarousel;
}
