/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

export const apiConfig = {
    host: 'http://52.23.188.104',
    port: '8080',
    basePath: 'hoot-services',
    mapnikServerPort: '8000',
    elementMergeServerPort: '8096',
    queryInterval: 2000
};

export const hootConfig = {
    maxNodeCount: 10000
};

export default apiConfig;

export let baseUrl = `${ apiConfig.host }:${ apiConfig.port }/${ apiConfig.basePath }`;