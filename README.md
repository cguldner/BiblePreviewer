# BiblePreviewer

This is a little Chrome extension that searches webpages for references to Bible verses. When it finds them, it 
adds a link to that text that can be hovered, showing the text of the verse above the link.

## Browser Support
* [Chrome](https://chrome.google.com/webstore/detail/bible-previewer/khknjdjihianlbkkbpmoemlkphkeaddi)
* [Firefox 57+](https://addons.mozilla.org/en-US/firefox/addon/bible-previewer/)

## Building
Run `gulp zip` to compile a build to the `dist` directory and create a zip of the necessary files

## Debugging in Firefox
To get the extension to work properly, add the `extensions` key temporarily to the manifest file
 
    "applications": {
      "gecko": {
        "id": "addon@example.com",
        "strict_min_version": "42.0"
      }
    }
