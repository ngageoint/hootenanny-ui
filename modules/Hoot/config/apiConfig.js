
/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

export const apiConfig = {
    host: window.location.protocol + '//' + window.location.host, //host includes port, hostname is just host name
    port: window.location.port,
    path: '/hoot-services',
    translationServerPort: 'switcher',
    mergeServerPort: '8096',
    queryInterval: 2000
};

export const hootConfig = {
    maxNodeCount: 10000
};

export default apiConfig;

export let baseUrl = `${ apiConfig.host }${ apiConfig.path }`;
