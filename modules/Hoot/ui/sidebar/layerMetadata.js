/*******************************************************************************************************
 * File: layerMetadata.js
 * Project: hootenanny-ui
 * @author Matt Putipong - matt.putipong@radiantsolutions.com on 4/16/18
 *******************************************************************************************************/

export default class LayerMetadata {
    constructor( context, form, layer ) {
        this.context  = context;
        this.form     = form;
        this.layer    = layer;
        this.tags     = layer.tags;
        this.metadata = null;
    }

    render() {
        this.createIconButton();
        this.createInnerWrapper();
        this.createBody();
        this.parseTags();
    }

    /**
     * Opens and closes the metadata panel. CSS height transition becomes disabled when open
     * to avoid unwanted side effects when expanding the tag lists
     */
    togglePanel() {
        let formState    = this.form.classed( 'expanded' ),
            wrapper      = this.innerWrapper,
            wrapperState = this.innerWrapper.classed( 'visible' ),
            wrapperNode  = this.innerWrapper.node();

        // remove listener so class isn't re-added to element
        function onEnd() {
            wrapper.classed( 'no-transition', true );
            wrapperNode.removeEventListener( 'transitionend', onEnd );
        }

        if ( wrapperNode.clientHeight ) {
            // close panel and re-enable transition
            this.innerWrapper.classed( 'no-transition', false );
            wrapperNode.style.height = '0';
        } else {
            // open panel
            let bodyNode = this.body.node();

            wrapperNode.style.height = bodyNode.clientHeight + 'px';
            // disable transition when panel is completely open
            wrapperNode.addEventListener( 'transitionend', onEnd, false );
        }

        this.form.classed( 'expanded', !formState );
        this.innerWrapper.classed( 'visible', !wrapperState );
    }

    toggleList( container, title ) {
        let state       = container.classed( 'expanded' ),
            wrapperNode = this.innerWrapper.node(),
            bodyNode    = this.body.node();

        container.classed( 'expanded', !state );
        d3.select( `[title="table-${ title }"` ).classed( 'hidden', state );

        wrapperNode.style.height = bodyNode.scrollHeight + 'px';
    }

    createIconButton() {
        this.form.select( '.controller' )
            .append( 'button' )
            .attr( 'tabindex', -1 )
            .classed( 'metadata-button icon-button keyline-left unround inline _icon info', true )
            .on( 'click', () => {
                d3.event.stopPropagation();
                d3.event.preventDefault();

                this.togglePanel();
            } );
    }

    createInnerWrapper() {
        this.innerWrapper = this.form.append( 'div' )
            .classed( 'inner-wrapper', true );
    }

    createBody() {
        this.body = this.innerWrapper.append( 'div' )
            .classed( 'metadata-body', true );
    }

    createExpandList( data, title ) {
        let container,
            table,
            tr,
            mapMeta = this;

        container = this.body.append( 'a' )
            .classed( 'hide-toggle-button expand-title', true )
            .text( title )
            .on( 'click', () => mapMeta.toggleList( container, title ) );

        table = this.body.append( 'table' )
            .attr( 'title', `table-${ title }` )
            .classed( 'metadata-table round hidden', true );

        tr = table.selectAll( 'tr' )
            .data( data ).enter()
            .append( 'tr' )
            .classed( 'metadata-row', true );

        tr.append( 'td' )
            .classed( 'metadata metadata-key keyline-right', true )
            .attr( 'title', d => d.key )
            .html( d => d.key );

        tr.append( 'td' )
            .classed( 'metadata metadata-value', true )
            .attr( 'title', d => d.value )
            .append( 'p' )
            .html( d => d.value );
    }

    parseTags() {
        let tags = JSON.parse( this.tags.params.replace( /\\"/g, '"' ) );

        let paramData = d3.entries( {
            'Reference Layer': this.tags.input1Name || 'Reference Layer Missing',
            'Secondary Layer': this.tags.input2Name || 'Secondary Layer Missing',
            'Conflation Type': tags.CONFLATION_TYPE,
            'Conflated Layer': this.layer.name
        } );

        let optData = d3.entries( tags.ADV_OPTIONS ).sort( ( a, b ) => {
            if ( a.key < b.key ) {
                return -1;
            }
            if ( a.key > b.key ) {
                return 1;
            }
            // a must be equal to b
            return 0;
        } );

        this.createExpandList( paramData, 'Parameters' );
        this.createExpandList( optData, 'Options' );
    }
}