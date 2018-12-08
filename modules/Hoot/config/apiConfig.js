
/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

export const apiConfig = {
    host: window.location.protocol + '//' + window.location.hostname, // just host name without port
    port: window.location.port,
    path: '/hoot-services',
    translationServerPort: process.env.NODE_ENV === 'prod' ? '8094' : '8080',
    translationServerPath: process.env.NODE_ENV === 'prod' ? '' : '/switcher',
    mergeServerPort: '8096',
    mapnikServerPort: '8000',
    queryInterval: 2000
};

export default apiConfig;

export let baseUrl = `${apiConfig.host}:${apiConfig.port}${apiConfig.path}`;
