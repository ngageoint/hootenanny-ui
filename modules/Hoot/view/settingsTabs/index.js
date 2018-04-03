/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Datasets from './datasets';
import TranslationAssistant from './translationAssistant';
import Translation from './translation';
import Basemaps from './basemaps';
import ReviewBookmarks from './reviewBookmarks';
import ReviewBookmarkNotes from './reviewBookmarkNotes';
import About from './about';

/**
 * Export all uninitialized tabs in an array
 */
export default [
    Datasets,
    TranslationAssistant,
    Translation,
    Basemaps,
    ReviewBookmarks,
    ReviewBookmarkNotes,
    About
];