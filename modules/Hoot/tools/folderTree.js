import _cloneDeep  from 'lodash-es/cloneDeep';
import _difference from 'lodash-es/difference';
import _drop       from 'lodash-es/drop';
import _filter     from 'lodash-es/filter';
import _find       from 'lodash-es/find';
import _findIndex  from 'lodash-es/findIndex';
import _forEach    from 'lodash-es/forEach';
import _remove     from 'lodash-es/remove';
import _slice      from 'lodash-es/slice';
import _uniq       from 'lodash-es/uniq';
import _without    from 'lodash-es/without';

import { duration, formatSize } from './utilities';

import EventEmitter from 'events';

import { svgIcon } from '../../svg';

/**
 * Class for creating, displaying and maintaining a folder tree hierarchy
 *
 * @param container - Container used to render the tree into
 * @constructor
 */
export default class FolderTree extends EventEmitter {
    constructor( container ) {
        super();

        this.container              = container;
        this.isAddDatasetTable      = this.container.attr( 'id' ) === 'add-ref-table' || this.container.attr( 'id' ) === 'add-secondary-table';
        this.isDatasetTable         = this.container.attr( 'id' ) === 'dataset-table';
        this.isTranslationTable     = this.container.attr( 'id' ) === 'translation-table';
        this.selectedNodes          = [];
        this.lastSelectedNode       = null;
        this.lastSelectedRangeNodes = null;

        this.datasetContextMenu = {
            multiDatasetOpts: {
                title: 'Export Selected Datasets',
                _icon: 'export',
                click: 'exportMultiDataset'
            },
            singleDatasetOpts: {
                title: 'Export',
                _icon: 'export',
                click: 'exportDataset'
            },
            singleOpenJosmOpts: {
                title: 'Open Dataset in JOSM',
                icon: 'map',
                click: 'openInJosm'
            },
            conflationProjectOpts: [
                {
                    title:'Export Alpha Shape',
                    icon:'alpha-shape',
                    click:'exportAlphaShape'
                },
                {
                    title:'Export Task Grid',
                    icon:'task-grid',
                    click:'exportTaskGrid'
                }
            ],
            addDatasetOpts: [
                {
                    title: 'Add as Reference Dataset',
                    formId: 'reference',
                    refType: 'primary',
                    _icon: 'plus',
                    click: 'addDataset'
                },
                {
                    title: 'Add as Secondary Dataset',
                    formId: 'secondary',
                    refType: 'secondary',
                    _icon: 'plus',
                    click: 'addDataset'
                }
            ]
        };

        this.folderContextMenu = [
            {
                title: 'Delete',
                _icon: 'trash',
                click: 'delete'
            },
            {
                title: 'Add Dataset',
                _icon: 'data',
                click: 'importDataset'
            },
            {
                title: 'Add Multiple Datasets',
                _icon: 'data',
                click: 'importMultiDatasets'
            },
            {
                title: 'Add Folder',
                _icon: 'folder',
                click: 'addFolder'
            },
            {
                title: 'Export Data in Folder',
                _icon: 'export',
                click: 'exportFolder'
            }
        ];

        this.translationContextMenu = [
            {
                title: 'Modify/Move Translation',
                _icon: 'info',
                click: 'modifyTranslation'
            },
            {
                title: 'Export Translation',
                _icon: 'export',
                click: 'exportTranslation'
            }
        ];

        this.translationFolderContextMenu = [
            {
                title: 'Delete',
                _icon: 'trash',
                click: 'deleteTranslationFolder'
            }
        ];

        this.margin    = { top: 10, right: 20, bottom: 30, left: 0 };
        this.width     = '100%';
        this.height    = '100%';
        this.barHeight = 20;
        this.duration  = 0;

        this.x = d3.scaleLinear()
            .domain( [ 0, 0 ] )
            .range( [ 0, 0 ] );

        this.y = d3.scaleLinear()
            .domain( [ 0, 0 ] )
            .range( [ 20, 0 ] );

        this.tree = d3.tree()
            .nodeSize( [ 0, 20 ] );

        this.svg = this.container.append( 'svg' )
            .attr( 'width', this.width )
            .attr( 'height', this.height )
            .append( 'g' )
            .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );

        if ( this.isDatasetTable ) {
            this.expiringTooltip = d3.select( '#manage-datasets' )
                .selectAll( '.tooltip-old-dataset' )
                .data( [ 0 ]  )
                .enter()
                .append( 'div' )
                .classed( 'tooltip-old-dataset', true )
                .text( 'This dataset has not been used in a while.' );
        }
    }

    /**
     * Initialize the folder tree
     */
    /**
     * Initialize the folder tree
     */
    async render() {
        let folders, foldersTree;

        if ( this.isDatasetTable || this.isAddDatasetTable ) {
            folders = _cloneDeep( await Hoot.folders.getAvailFolderData() );

            if ( this.isDatasetTable ) {
                folders = _without( folders, _find( folders, { id: -1 } ) );
            }

            foldersTree = {
                name: 'Datasets',
                id: 'Datasets',
                children: folders // prevent collision of data
            };
        } else if ( this.isTranslationTable ) {
            folders = _cloneDeep( await Hoot.folders.getTranslationFolderData() );

            folders = _without( folders, _find( folders, { id: -1 } ) );

            foldersTree = {
                name: 'Translations',
                id: 'Translations',
                children: folders // prevent collision of data
            };
        }

        this.root    = d3.hierarchy( foldersTree );
        this.root.x0 = 0;
        this.root.y0 = 0;

        this.update( this.root );
    }

    /**
     * Update the tree by adding/deleting nodes
     *
     * @param source - source node used to update tree
     */
    update( source ) {
        let nodeTree = this.tree( this.root ),
            height;

        this.nodes = this.sortNodes( nodeTree );

        let nodes       = this.svg.selectAll( 'g.node' ).data( this.nodes, d => d ),
            nodeElement = this.createNodeElement( nodes, source );

        height = Math.max( 150, this.nodes.length * this.barHeight );

        this.container.select( 'svg' ).transition()
            .duration( 0 )
            .style( 'height', `${ height }px` );

        // Render text values and lines for nodes
        this.renderText( nodeElement );
        this.renderLines( nodeElement.filter( d => d.depth > 1 ) );

        this.root.each( d => {
            d.x0 = d.x;
            d.y0 = d.y;
        } );
    }

    /**
     * Update nodes to all have a consistent data structure and
     * sort them so that they render in the correct order
     *
     * @param nodes - tree nodes
     * @returns {Array} - sorted nodes
     */
    sortNodes( nodes ) {
        let nodesSort   = [],
            parentDepth = 0,
            i           = 0; // manual iteration because eachBefore doesn't provide a key

        nodes.eachBefore( n => {
            // set vertical and horizontal position of node
            n.x = (i - 1) * this.barHeight;
            n.y = n.depth * 20;

            // update leaf nodes (nodes with no children) to have similar structure to regular nodes
            if ( n.depth && n.depth > 0 ) {
                parentDepth = n.depth;
            } else {
                n.depth = parentDepth + 1;
            }

            //this causes a circular reference
            if ( !n.data ) {
                n.data = n;
            }

            if ( n.data.type === 'folder' ) {
                const folderData = this.calculateFolderData( n );
                n.data.size = folderData.totalSize;
                n.data.lastAccessed = folderData.lastAccessed;
            }

            nodesSort.push( n );
            i++;
        } );

        return nodesSort;
    }

    /**
     * Recurses through the folder down and calculates the size, in bytes, of all the datasets under the root file
     * @param root
     * @returns {totalSize: number, importDate: string, lastAccessed: string}
     */
    calculateFolderData ( root ) {
        let stack = [ root ];
        let data = {
            totalSize : 0,
            lastAccessed : ''
        };

        while ( stack.length > 0 ) {
            const folder = stack.pop();
            // children are stored in different locations in the object based on whether the folder is open or not
            // return an empty array if null or undefined
            const children = folder.children || folder._children || (folder.data ? folder.data._children : []) || [];

            // skip if no children
            if (children.length === 0) continue;

            data.totalSize += children.filter( child => {
                return ( child.type && child.type === 'dataset' ) || ( child.data && child.data.type && child.data.type === 'dataset' );
            } ).reduce( ( acc, dataset ) => {
                const lastAccessed = dataset.lastAccessed || dataset.data.lastAccessed;
                if ( !data.lastAccessed || ( new Date(data.lastAccessed) < new Date(lastAccessed) ) ) {
                    data.lastAccessed = lastAccessed;
                }

                return acc + (dataset.size || dataset.data.size);
            }, 0 );

            const folders = children.filter( child => (child.type === 'folder') || (child.data && child.data.type && child.data.type === 'folder') );

            stack = stack.concat(folders);
        }

        return data;
    }

    /**
     * Create base DOM element for node. Set it's position, icon, and name
     *
     * @param nodes - node data
     * @param source - source node used to update tree
     * @returns {d3} - node DOM element
     */
    createNodeElement( nodes, source ) {
        const self = this;

        let nodeElement = nodes.enter().append( 'g' )
            .attr( 'data-name', d => d.data.name )
            .attr( 'data-id', d => d.data.id )
            .attr( 'data-type', d => d.data.type )
            .attr( 'transform', `translate( 0, ${ source.x0 } )` )
            .classed( 'node', true )
            .style( 'opacity', 0 )
            .on( 'click', function( d3_event, d ) {
                // use self as context but still pass in the clicked element
                self.click.call( self, d3_event, this, d );//pass event
            } )
            .on( 'dblclick', (d3_event, d) => {
                d3_event.preventDefault();
                // if this is an add dataset table, add layer to map on double click
                if ( this.isAddDatasetTable ) {
                    this.doubleClickHandler.call(this.doubleClickRef, d3_event, d, false);
                }
            } )
            .on( 'mousedown', (d3_event) => {
                d3_event.preventDefault();
            } )
            .on( 'contextmenu', (d3_event, d) => {
                d3_event.preventDefault();

                if ( this.isDatasetTable || this.isTranslationTable ) {
                    this.bindContextMenu( d3_event, d );
                }
            } );

        // Render node rect
        nodeElement.append( 'rect' )
            .attr( 'y', -this.barHeight / 2 )
            .attr( 'height', this.barHeight )
            .attr( 'width', '100%' )
            .attr( 'class', d => this.rectClass( d ) )
            .style( 'fill', d => this.fillColor( d ) );

        // Render node icon
        nodeElement.append( 'g' )
            .append( 'svg:foreignObject' )
            .attr( 'width', 20 )
            .attr( 'height', 20 )
            .attr( 'transform', d => {
                let dd = d.depth - 1,
                    dy = 5.5 + (11 * dd);

                return `translate( ${ dy }, -11 )`;
            } )
            .html( d => {
                let { data } = d;

                if ( data.type === 'folder' ) {
                    if ( data.state === 'open' ) {
                        return '<i class="_icon open-folder"></i>';
                    } else {
                        return '<i class="_icon folder"></i>';
                    }
                } else if ( data.type === 'dataset' ) {
                    return '<i class="_icon data"></i>';
                } else if ( data.type === 'translation' ) {
                    return '<i class="_icon file"></i>';
                }
            } );

        // Render node name
        nodeElement
            .append( 'text' )
            .style( 'fill', this.fontColor )
            .classed( 'dnameTxt', true )
            .attr( 'dy', 3.5 )
            .attr( 'dx', d => {
                let dd = d.depth - 1;
                return 25.5 + (11 * dd);
            } )
            .append( 'tspan' ).text( d => d.data.name );

        // Render node owner
        if ( this.isDatasetTable || this.isTranslationTable ) {
            nodeElement
                .append( 'text' )
                .style( 'fill', this.fontColor )
                .classed( 'dnameTxt', true )
                .attr( 'dy', 3.5 )
                .attr( 'dx', '30%' )
                .attr( 'text-anchor', 'start' )
                .append( 'tspan' ).text( d => {
                    if ( d.data.userId ) {
                        return Hoot.users.getNameForId( d.data.userId );
                    }
                } );
        }

        // Transition nodes to their new position
        nodeElement.transition()
            .duration( this.duration )
            .attr( 'transform', d => `translate( 0, ${ d.x } )` )
            .style( 'opacity', 1 );

        // remove old elements
        nodes.exit().remove();

        return nodeElement;
    }

    /**
     * Render lines that connect nodes together
     *
     * @param nodes - tree nodes
     */
    renderLines( nodes ) {
        nodes.append( 'line' )
            .attr( 'x1', d => 2.5 + (11 * (d.depth - 1)) )
            .attr( 'x2', d => 9.5 + (11 * (d.depth - 1)) )
            .attr( 'y1', 0 )
            .attr( 'y2', 0 )
            .style( 'stroke', '#444444' );

        nodes.append( 'line' )
            .attr( 'x1', d => 2.5 + (11 * (d.depth - 1)) )
            .attr( 'x2', d => 2.5 + (11 * (d.depth - 1)) )
            .attr( 'y1', -20 )
            .attr( 'y2', 0 )
            .style( 'stroke', '#444444' );
    }

    getNavigatorLanguage() {
        return (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';
    }

    /**
     * Render text values for each node
     *
     * @param nodes - tree nodes
     */
    renderText( nodes ) {
        let that = this;

        nodes.append( 'text' )
            .classed( 'dsizeTxt', true )
            .style( 'fill', this.fontColor )
            .attr( 'dy', 3.5 )
            .attr( 'dx', '97%' )
            .attr( 'text-anchor', 'end' )
            .text( d => {
                if ( d.data.size ) {
                    return formatSize( d.data.size );
                }
            } );

        if ( this.isDatasetTable ) {
            nodes.append( 'text' )
                .style( 'fill', this.fontColor )
                .attr( 'dy', 3.5 )
                .attr( 'dx', '85%' )
                .attr( 'text-anchor', 'end' )
                .text( d => {
                    let createDate = new Date(d.data.date);

                    return createDate.toLocaleString(this.getNavigatorLanguage(), {timeZone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                });

            nodes.append( 'text' )
                .style( 'fill', this.fontColor )
                .attr( 'dy', 3.5 )
                .attr( 'dx', '65%' )
                .attr( 'text-anchor', 'end' )
                .text( function( d ) {
                    if ( d.data.lastAccessed ) {
                        let lastAccessed = new Date(d.data.lastAccessed),
                            now = Date.now();

                        if ( now - lastAccessed > 5184000000 ) { //60 days
                            that.updateLastAccessed( this );
                        }

                        return duration(lastAccessed, now, true);
                    } else {
                        return '';
                    }
                } );
        }
    }

    updateLastAccessed( node ) {
        let row = d3.select( node.parentNode );

        row
            .classed( 'expiring', true )
            .on( 'mousemove', (d3_event) => {
                this.expiringTooltip
                    .style( 'left', Math.max( 0, d3_event.pageX - 200 ) + 'px' )
                    .style( 'top', ( d3_event.pageY - 50 ) + 'px' )
                    .style( 'opacity', '0.9' );
            } )
            .on( 'mouseout', () => {
                this.expiringTooltip.style( 'opacity', 0 );
            } )
            .append( 'g' )
            .append( 'svg' )
            .attr( 'y', '-9px' )
            .attr( 'x', '56%' )
            .append( 'image' )
            .attr( 'href', './img/timer.png' )
            .style( 'width', '18px' )
            .style( 'height', '18px' );
    }

    /**
     * Fill a rect element based on it's node type
     *
     * @param d - tree node
     * @returns {string} - Hex color code
     */
    fillColor( d ) {
        let { data } = d;
        if ( data.selected )  return '#ffff99';

        if (data.type) return (data.public) ? '#7092ff' : '#efefef';

        return '#ffffff';

    }

    /**
     * Fill a text element based on it's node type
     *
     * @param d - tree node
     * @returns {string} - hex color code
     */
    fontColor( d ) {
        let { data } = d;

        if ( data.selected ) return '#7092ff';

        if ( data.type ) return (data.public) ? '#ffffff' : '#7092ff';

        return '#ffffff';
    }

    /**
     * Assign a CSS class to a rect element based
     * on it's type and the current state that it's in
     *
     * @param d - tree node
     * @returns {string} - CSS class
     */
    rectClass( d ) {
        let { data } = d;

        return data.selected
            ? 'sel'
            : data._children
                ? 'more'
                : 'flat';
    }

    /**
     * Logic for right-click and ctrl+click
     *
     * @param d3_event - window event
     * @param d - tree node
     */
    bindContextMenu( d3_event, d ) {
        let { data } = d,
            selected = d.data.selected || false;

        if ( !selected ) {
            let selectedNodes = _filter( this.root.descendants(), node => node.data.selected );

            // Un-select all other nodes
            _forEach( selectedNodes, node => {
                node.data.selected = false;
            } );

            data.selected         = true;
            this.selectedNodes    = [ data ];
            this.lastSelectedNode = data.id;
        }

        if ( this.contextMenu ) {
            this.contextMenu.remove();
        }

        this.openContextMenu( d3_event, d );

        this.update( d );
    }

    /**
     * Render the context menu for a dataset or folder
     *
     * @param d - tree node
     */
    openContextMenu( d3_event, d ) {
        let { data } = d,
            opts;

        const selectedCount = this.selectedNodes.length;

        if ( this.isTranslationTable ) {
            if (data.type === 'translation') {
                opts = [...this.translationContextMenu.slice()];

                // Don't allow move and delete for default translations
                if ( !d.data.default ) {
                    opts.push({
                        title: 'Delete',
                        _icon: 'trash',
                        click: 'deleteTranslation'
                    });
                }
            } else if (data.type === 'folder') {
                opts = [...this.translationFolderContextMenu.slice()];

                opts.splice(1, 0, {
                    title: 'Modify/Move Folder',
                    _icon: 'info',
                    click: 'modifyFolder'
                });
            }
        } else {

            if (data.type === 'dataset') {

                opts = [
                    {
                        title: `Delete (${selectedCount})`,
                        _icon: 'trash',
                        click: 'delete'
                    }
                ];

                if (selectedCount > 1 && selectedCount <= 10) {

                    // // add options for opening multiple datasets in JOSM
                    // opts = [
                    //     {
                    //         title: `Open Selected Datasets in JOSM (${selectedCount})`,
                    //         _icon: 'data',
                    //         click: 'openMultiInJosm'
                    //     }
                    // ];

                    // add options for multiple selected datasets
                    opts.push(this.datasetContextMenu.multiDatasetOpts);

                    opts.splice(1, 0, {
                        title: `Move (${selectedCount})`,
                        _icon: 'info',
                        click: 'modifyDataset'
                    });
                } else {
                    // add options for single selected dataset
                    _forEach(this.datasetContextMenu.addDatasetOpts, o => {

                        let formMeta = Hoot.ui.sidebar.forms[o.formId];

                        if (formMeta) {
                            let form = formMeta.form;
                            if (form && !form.attr('data-id')) {
                                opts.push(o);
                            }
                        }
                    });

                    opts.splice(4, 0, {
                        title: `Move/Rename ${data.name}`,
                        _icon: 'info',
                        click: 'modifyDataset'
                    });

                    // add options for opening a single dataset in JOSM
                    opts.push(this.datasetContextMenu.singleOpenJosmOpts);

                    opts.push(this.datasetContextMenu.singleDatasetOpts);

                    if (Hoot.users.isAdvanced()) {
                        opts = opts.concat(this.datasetContextMenu.conflationProjectOpts);
                    }
                }
            } else if (data.type === 'folder') {

                if (selectedCount === 1) {
                    opts = [...this.folderContextMenu.slice()]; // make copy of array to not overwrite default vals
                    opts.splice(1, 0, {
                        title: 'Modify/Move Folder',
                        _icon: 'info',
                        click: 'modifyFolder'
                    });
                } else if (selectedCount > 1) {
                    opts = [
                        {
                            title: `Delete (${selectedCount})`,
                            _icon: 'trash',
                            click: 'delete'
                        },
                        {
                            title: 'Move Folders',
                            _icon: 'info',
                            click: 'modifyFolder'
                        },
                        {
                            title: 'Export Data in Folders',
                            _icon: 'export',
                            click: 'exportFolder'
                        }
                    ];
                }
            }
        }

        if (opts.length === 0) return;

        let body = d3.select( 'body' )
            .on( 'click', () => d3.selectAll( '.context-menu' ).style( 'display', 'none' ) );

        this.contextMenu = body
            .append( 'div' )
            .classed( 'context-menu', true )
            .style( 'display', 'none' );

        this.contextMenu
            .html( '' )
            .append( 'ul' )
            .selectAll( 'li' )
            .data( opts )
            .enter()
            .append( 'li' )
            //trying to deprecate the _icon class and replace with svgIcon
            //in the meantime, both are supported though should be exclusive
            .attr( 'class', item => (item._icon) ? `_icon ${ item._icon }` : null )
            .each( function(item) {
                if (item.icon) {
                    d3.select(this)
                    .call(svgIcon(`#iD-icon-${ item.icon }`));
                }
            })
            .on( 'click', item => {
                if (this.isTranslationTable) {
                    return Hoot.events.emit( 'translation-context-menu', this, d, item );
                } else {
                    return Hoot.events.emit( 'context-menu', this, d, item );
                }
            } )
            .append('span').text( item => item.title );

        // Make sure the context menu does not dip below the screen horizon
        let windowHeight = window.innerHeight;
        let yCoord = d3_event.pageY - 2;
        this.contextMenu
            .style( 'left', `${ d3_event.pageX - 2 }px` )
            .style( 'top', `${ yCoord }px` )
            .style( 'display', 'block' );
        let menuHeight = this.contextMenu.node().offsetHeight;
        let overflowHeight = windowHeight - (yCoord + menuHeight);
        if (overflowHeight < 0) {
            this.contextMenu
                .style( 'top', `${ yCoord + overflowHeight }px` );
        }

    }

    /**
     * Select, expand, or collapse an item in the table.
     *
     * @param elem - clicked DOM element
     * @param d - tree node
     */
    click( d3_event, elem, d ) {
        let { data } = d,
            selected = data.selected || false,
            isOpen   = data.state === 'open';

        if ( d3_event.shiftKey && this.lastSelectedNode && this.isDatasetTable ) {
            let nodes        = _drop( this.nodes, 1 ),
                basePosition = _findIndex( nodes, node => node.data.id === this.lastSelectedNode ),
                position     = _findIndex( nodes, node => node.data.id === data.id ),
                selectBegin  = Math.min( basePosition, position ),
                selectEnd    = Math.max( basePosition, position ) + 1,

                rangeNodes   = _slice( nodes, selectBegin, selectEnd );

            if ( basePosition !== this.lastBasePosition ) {
                // user ctrl+clicked on a new location
                this.lastSelectedRangeNodes = [];
            } else {
                // unselect nodes from previous range that don't match the new range
                let oldNodes = _difference( this.lastSelectedRangeNodes, rangeNodes );

                _forEach( oldNodes, node => {
                    node.data.selected = false;
                    _remove( this.selectedNodes, layer => layer.id === node.data.id );
                } );
            }

            // select nodes starting from base position to current position
            _forEach( rangeNodes, node => {
                //omit non-matching nodes
                if (this.selectedNodes[0].type === node.data.type
                    //and children if folders
                    && !(this.selectedNodes.map(n => n.id).includes(node.data.parentId))
                    ) { //from selection
                    node.data.selected = true;
                    this.selectedNodes.push( node.data );
                    this.lastSelectedRangeNodes.push( node );
                }
            } );


            this.selectedNodes    = _uniq( this.selectedNodes );
            this.lastBasePosition = basePosition;
        } else if ( d3_event.ctrlKey && this.isDatasetTable ) {
            data.selected = !data.selected;
            if (data.selected) {
                this.selectedNodes.push( data );
                //filter selected nodes of different type
                //multiselect must be all folders or all datasets
                this.selectedNodes = this.selectedNodes.filter(function(d) {
                    //remove highlighting from non-matching
                    if (d.type !== data.type) d.selected = false;
                    //remove node non-matching from selection
                    return d.type === data.type;
                });
            } else {
                this.selectedNodes = this.selectedNodes.filter(function(d) {
                    return d.id !== data.id;
                });
            }
        } else {
            // get all currently selected nodes
            let selectedNodes = _filter( this.root.descendants(), d => d.data.selected );

            // un-select all other nodes
            _forEach( selectedNodes, node => {
                node.data.selected = false;
            } );

            // if multiple are already selected, keep the target node selected
            if ( selectedNodes.length > 1 && selected ) {
                data.selected = true;
            } else {
                data.selected = !selected;
            }

            this.selectedNodes    = [ data ];
            this.lastSelectedNode = data.selected ? data.id : null;

            //also handle open/close folder
            if (data.type === 'folder') {
                if ( isOpen ) {
                    // close folder
                    data.state = 'closed';

                    d3.select( elem.parentNode )
                        .select( 'i' )
                        .classed( 'folder', true )
                        .classed( 'open-folder', false );

                    if ( d.children ) {
                        data._children = d.children;
                        d.children     = null;
                        data.selected  = false;
                    }
                } else {
                    // open folder
                    data.state = 'open';

                    d3.select( elem.parentNode )
                        .select( 'i' )
                        .classed( 'folder', false )
                        .classed( 'open-folder', true );

                    d.children     = data._children || null;
                }

                if ( this.isDatasetTable && !d3_event.ctrlKey ) {
                    Hoot.folders.setOpenFolders( data.id, !isOpen );
                } else if ( this.isTranslationTable ) {
                    Hoot.folders.setOpenTranslationFolders( data.id, !isOpen );
                }
            }
        }

        this.update( d );
    }

    setDoubleClickHandler(ref, handler) {
        this.doubleClickRef = ref;
        this.doubleClickHandler = handler;
    }
}
