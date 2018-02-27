/** ****************************************************************************************************
 * File: reviewBookmarks.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

'use strict';

import Tab from './tab';

export default class ReviewBookmarks extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Review Bookmarks';
        this.id   = 'util-review-bookmarks';
    }

    render() {
        super.render();
    }

    init() {
        this.render();
    }
}