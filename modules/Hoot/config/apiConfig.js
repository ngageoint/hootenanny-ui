/** ****************************************************************************************************
 * File: apiConfig.js
 * Project: hootenanny-ui
 * @author Matt Putipong on 3/2/18
 *******************************************************************************************************/

export const apiConfig = {
    host: 'http://localhost',
    port: '8999',
    basePath: 'hoot-services',
    mapnikServerPort: '8000',
    queryInterval: 1000
};

export const hootConfig = {
    maxNodeCount: 10000
};

export default apiConfig;

export let baseUrl = `${ apiConfig.host }:${ apiConfig.port }/${ apiConfig.basePath }`;