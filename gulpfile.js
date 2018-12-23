const gulp = require('gulp');
const uglify = require('gulp-uglify-es').default;
const zip = require('gulp-zip');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const manifestFile = require('./manifest.json');
const sass = require('gulp-sass');

const distFolder = 'dist';

function taskUglify () {
    return gulp.src('js/**/*')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(uglify({mangle: true}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(distFolder + '/js'))
};

function taskSass () {
    let sassOptions = {
        errLogToConsole: true,
        outputStyle: 'compressed'
    };
    return gulp.src('*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(distFolder));
};

function taskMove () {
    return gulp.src(['manifest.json', '*.html', 'icons/**/*'], {base: '.'})
        .pipe(gulp.dest(distFolder))
};

function taskZip () {
    gulp.src(distFolder + '/**/*')
        .pipe(zip('BiblePreview.v' + manifestFile.version + '.zip'))
        .pipe(gulp.dest('./'));

    return gulp.src(['js/*', '*.scss', 'manifest.json', '*.html', 'icons/*'], {base: './'})
        .pipe(zip('BiblePreviewSource.zip'))
        .pipe(gulp.dest('./'));
};

function taskWatch () {
    gulp.watch('js/**/*.js', gulp.series('uglify'));
    gulp.watch('*.scss', gulp.series('sass'));
    gulp.watch(['manifest.json', '*.html', 'icons/**/*'], gulp.series('move'));
};

function taskClean () {
    return gulp.src([distFolder, '*.zip'], { allowEmpty: true }).pipe(clean())
};

gulp.task('uglify', taskUglify);
gulp.task('sass', taskSass);
gulp.task('move', taskMove);
gulp.task('build', gulp.parallel(['uglify', 'move', 'sass']));
gulp.task('zip', gulp.series('build', taskZip));
gulp.task('watch', gulp.series('build', taskWatch));
gulp.task('clean', taskClean);
gulp.task('default', taskZip);
