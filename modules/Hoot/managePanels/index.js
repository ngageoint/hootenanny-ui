/** ****************************************************************************************************
 * File: index.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 2/27/18
 *******************************************************************************************************/

import Datasets             from './datasets';
import TranslationAssistant from './translationAssistant/translationAssistant';
import Translation          from './translation/translation';
import Basemaps             from './basemaps/basemaps';
import ReviewBookmarks      from './reviewBookmarks';
import ReviewBookmarkNotes  from './reviewBookmarkNotes';
import About                from './about';

/**
 * Export all uninitialized managePanels in an array
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