const {defineConfig} = require('cypress');

module.exports = defineConfig({
    env: {
        testFile: 'cypress/test.html',
        containerSelector: 'span.biblePreviewerContainer',
        linkSelector: '.biblePreviewerLink',
        tooltipSelector: '.biblePreviewerTooltip',
        tooltipTextSelector: '.bpTooltipContent',
        apiEndpoint: '**/api.scripture.api.bible/v1/**',
    },
    screenshotOnRunFailure: false,
    watchForFileChanges: false,
    video: false,
    e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            // eslint-disable-next-line global-require
            return require('./cypress/plugins/index.js')(on, config);
        },
    },
});
