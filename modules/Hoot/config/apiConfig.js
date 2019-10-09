
/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

// strip any filename at end of path and make relative to ../
// unless we are at the root

function relativePath() {
    let path = window.location.pathname;
    let pathWithoutFile = path.substr(0, path.lastIndexOf('/'));
    let pathRelative = ( (pathWithoutFile === '') ? '' : '..' ) + '/hoot-services';

    return pathRelative;
}

export const apiConfig = {
    host: window.location.protocol + '//' + window.location.host, // just host name without port
    port: window.location.port,
    path: relativePath(),
    translationServerPort: '8094',
    mergeServerPort: '8096',
    queryInterval: 2000
};

export default apiConfig;

export let baseUrl = `${apiConfig.path}`;
