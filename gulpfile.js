const gulp = require('gulp');
const zip = require('gulp-zip');
const manifestFile = require('./manifest.json');

const distFolder = 'dist';

// Convert this over to GruntJS

/**
 * Creates two zips:
 *  1. A production zip that is the extension code that will execute
 *  2. A source zip that contains all the code needed to create the production zip
 *
 *  @returns {any} A gulp task
 */
function taskZip() {
    gulp.src(distFolder + '/**/*')
        .pipe(zip('BiblePreview.v' + manifestFile.version + '.zip'))
        .pipe(gulp.dest('./'));

    return gulp.src(['js/*', 'css/*', 'html/*', 'icons/*', '*.js*', '!package-lock.json', 'README.md', 'build_versions.txt'], {base: './'})
        .pipe(zip('BiblePreviewSource.zip'))
        .pipe(gulp.dest('./'));
}

gulp.task('zip', taskZip);
gulp.task('default', taskZip);
