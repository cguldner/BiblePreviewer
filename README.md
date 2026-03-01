# BiblePreviewer

This is a little Chrome/Firefox extension that searches web pages for references to Bible verses. When it finds them, it
adds a link to that text that can be hovered, showing the text of the verse above the link.

## Browser Support

- [Chrome](https://chrome.google.com/webstore/detail/bible-previewer/khknjdjihianlbkkbpmoemlkphkeaddi)
- [Firefox 57+](https://addons.mozilla.org/en-US/firefox/addon/bible-previewer/)

## Building

Create a `.env` file with the following contents:

```shell
BIBLE_API_KEY=<API_KEY>
```

Run `npm run watch` to have webpack watch the files for changes.

Run `npm run zip` to compile a production build to the `dist` directory and create an archive of the necessary files

## Testing

Run end-to-end tests with:

```shell
npm test
```

Cypress runs against Chrome in this repo. On Linux CI/containers it also requires `Xvfb` to provide a virtual display.
If you see `Error: spawn Xvfb ENOENT`, install Xvfb (or use a Cypress Docker image that already includes required system dependencies) before running tests.

