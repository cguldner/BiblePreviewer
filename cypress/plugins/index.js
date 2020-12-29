const path = require('path');

// eslint-disable-next-line jsdoc/require-jsdoc
module.exports = (on, config) => {
    on('before:browser:launch', (browser, launchOptions) => {
        // supply the absolute path to an unpacked extension's folder
        // NOTE: extensions cannot be loaded in headless Chrome
        launchOptions.extensions.push(path.join(config.fileServerFolder, 'dist'));

        return launchOptions;
    });
};
