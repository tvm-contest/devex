const APP_ROOT = __dirname + '/../..';

export const globals = {
    APP_PORT: process.env.PORT || 3001,
    APP_ROOT,
    PUBLIC_ROOT: APP_ROOT + '/public',
    BASE_PATH: process.env.BASE_PATH || '',
};
