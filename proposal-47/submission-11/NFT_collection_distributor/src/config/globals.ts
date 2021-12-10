const path = require('path');

const APP_ROOT = __dirname + '/../..';
const TEMP_ROOT =  path.join(APP_ROOT, 'temp');

export const globals = {
    APP_PORT: process.env.PORT || 3001,
    APP_ROOT,
    TEMP_ROOT,
    RESULT_COLLECTION: path.join(APP_ROOT, 'result', 'collections'),
    RESULT_JSON: path.join(APP_ROOT, 'result', 'json'),
    CONTRACTS_ROOT: path.join(APP_ROOT, 'src', 'contracts'),
    PUBLIC_ROOT: path.join(APP_ROOT, 'public'),
    BASE_PATH: process.env.BASE_PATH || '',
    SAMPLE_DATA_PATH: path.join(APP_ROOT, 'src', 'sample-data'),
	//SERVICES_TEMP_ROOT: (APP_ROOT, '/src/services/temp/')
};
