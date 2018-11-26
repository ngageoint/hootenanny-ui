/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

export const apiConfig = {
    host: window.location.protocol + '//' + window.location.host,
    port: '8080',
    path: '/hoot-services',
    translationServerPort: '8094',
    mapnikServerPort: '8000',
    mergeServerPort: '8096',
    queryInterval: 2000
};

export const hootConfig = {
  maxNodeCount: 10000
};

export default apiConfig;

export let baseUrl = `${ apiConfig.host }/hoot-services`;
