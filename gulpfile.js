const gulp = require('gulp');
const uglify = require('gulp-uglify-es').default;
const zip = require('gulp-zip');
const clean = require('gulp-clean');
const packageFile = require('./package.json');

const distFolder = 'dist';

gulp.task('uglify', () =>
    gulp.src('*.js')
        .pipe(uglify({mangle: true}))
        .pipe(gulp.dest(distFolder))
);

gulp.task('move', () =>
    gulp.src(['*.css', 'manifest.json', '*.html', 'icons'])
        .pipe(gulp.dest(distFolder))
);

gulp.task('zip', ['uglify', 'move'], () =>
    gulp.src(distFolder + '/**/*')
        .pipe(zip('BiblePreview.v' + packageFile.version + '.zip'))
        .pipe(gulp.dest(''))
);

gulp.task('default', ['zip']);

gulp.task('clean', () => gulp.src([distFolder, '*.zip']).pipe(clean()));
