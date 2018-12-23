const gulp = require('gulp');
const zip = require('gulp-zip');
const manifestFile = require('./manifest.json');

const distFolder = 'dist';

function taskZip () {
    gulp.src(distFolder + '/**/*')
        .pipe(zip('BiblePreview.v' + manifestFile.version + '.zip'))
        .pipe(gulp.dest('./'));

    return gulp.src(['js/*', '*.scss', 'manifest.json', '*.html', 'icons/*'], {base: './'})
        .pipe(zip('BiblePreviewSource.zip'))
        .pipe(gulp.dest('./'));
}

gulp.task('zip', taskZip);
gulp.task('default', taskZip);
