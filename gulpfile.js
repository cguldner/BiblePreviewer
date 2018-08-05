const gulp = require('gulp');
const uglify = require('gulp-uglify-es').default;
const zip = require('gulp-zip');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const packageFile = require('./package.json');

const distFolder = 'dist';

gulp.task('uglify', () =>
    gulp.src('js/*')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(uglify({mangle: true}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(distFolder + '/js'))
);

gulp.task('move', () =>
    gulp.src(['*.css', 'manifest.json', '*.html', 'icons/**/*'], {base: '.'})
        .pipe(gulp.dest(distFolder))
);

gulp.task('build', ['uglify', 'move']);

gulp.task('zip', ['build'], () =>
    gulp.src(distFolder + '/**/*')
        .pipe(zip('BiblePreview.v' + packageFile.version + '.zip'))
        .pipe(gulp.dest(''))
);

gulp.task('default', ['zip']);


gulp.task('watch', ['build'], function () {
    gulp.watch(['js/*.js', '*.css', 'manifest.json', '*.html', 'icons/**/*'], ['build']);
});


gulp.task('clean', () => gulp.src([distFolder, '*.zip']).pipe(clean()));
