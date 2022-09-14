
/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

// strip any filename at end of path and make relative to ../
// unless we are at the root

function relativePath() {
    let path = window.location.pathname;
    let pathWithoutFile = '/' + path.split('/').filter(p => p.length).slice(0, -1).join('/');
    let pathRelative = pathWithoutFile + 'hoot-services';

    return pathRelative;
}

export const apiConfig = {
    host: window.location.protocol + '//' + window.location.host, // just host name without port
    port: window.location.port,
    path: relativePath(),
    /* eslint-disable no-undef */
    tm4ApiUrl: tm4ApiUrl || '/tm4api',
    translationServerPort: translationServerPort || '8094',
    mergeServerPort: mergeServerPort || '8096',
    /* eslint-enable no-undef */
    queryInterval: 2000,
    runTasksInterval: 90000,
    rateLimit: 20 //supports 20 concurrent file uploads or deletes
};

export default apiConfig;

export let baseUrl = `${apiConfig.path}`;
export let rateLimit = apiConfig.rateLimit;
