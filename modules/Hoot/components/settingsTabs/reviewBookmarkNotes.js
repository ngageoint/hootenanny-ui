/** ****************************************************************************************************
 * File: reviewBookmarkNotes.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Tab from './tab';

/**
 * Creates the review-bookmark-notes tab in the settings panel
 *
 * @extends Tab
 * @constructor
 */
export default class ReviewBookmarkNotes extends Tab {
    constructor( ...params ) {
        super( params );

        this.name = 'ReviewBookmarkNotes';
        this.id   = 'util-review-bookmark-notes';
    }

    render() {
        super.render();
    }
}