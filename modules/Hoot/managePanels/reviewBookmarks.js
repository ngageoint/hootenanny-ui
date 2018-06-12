/** ****************************************************************************************************
 * File: reviewBookmarks.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';

/**
 * Creates the review-bookmarks tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class ReviewBookmarks extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'Review Bookmarks';
        this.id   = 'util-review-bookmarks';
    }

    render() {
        super.render();
    }
}