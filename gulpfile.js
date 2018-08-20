const gulp = require('gulp');
const uglify = require('gulp-uglify-es').default;
const zip = require('gulp-zip');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const manifestFile = require('./manifest.json');
const sass = require('gulp-sass');

const distFolder = 'dist';

gulp.task('uglify', () =>
    gulp.src('js/**/*')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(uglify({mangle: true}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(distFolder + '/js'))
);

gulp.task('sass', function () {
    let sassOptions = {
        errLogToConsole: true,
        outputStyle: 'compressed'
    };
    gulp.src('*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(distFolder));
});

gulp.task('move', () =>
    gulp.src(['manifest.json', '*.html', 'icons/**/*'], {base: '.'})
        .pipe(gulp.dest(distFolder))
);

gulp.task('build', ['uglify', 'move', 'sass']);

gulp.task('zip', ['build'], () =>
    gulp.src(distFolder + '/**/*')
        .pipe(zip('BiblePreview.v' + manifestFile.version + '.zip'))
        .pipe(gulp.dest(''))
);

gulp.task('default', ['zip']);

gulp.task('watch', ['build'], function () {
    gulp.watch('js/**/*.js', ['uglify']);
    gulp.watch('*.scss', ['sass']);
    gulp.watch(['manifest.json', '*.html', 'icons/**/*'], ['move']);
});


gulp.task('clean', () => gulp.src([distFolder, '*.zip']).pipe(clean()));
