
/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

export const apiConfig = {
    host: window.location.protocol + '//' + window.location.host, // just host name without port
    port: window.location.port,
    path: window.location.pathname + '../hoot-services',
    translationServerPort: '8094',
    mergeServerPort: '8096',
    queryInterval: 2000
};

export default apiConfig;

export let baseUrl = `${apiConfig.host}${apiConfig.path}`;
