/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

export const apiConfig = {
    host: 'http://34.201.113.202',
    port: '8080',
    path: 'hoot-services',
    translationServerPort: '8094',
    mapnikServerPort: '8000',
    mergeServerPort: '8096',
    queryInterval: 2000
};

export default apiConfig;

export let baseUrl = `${ apiConfig.host }:${ apiConfig.port }/hoot-services`;
