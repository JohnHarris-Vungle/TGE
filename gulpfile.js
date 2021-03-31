const { src, dest, series, parallel } = require('gulp');
const jsdoc = require('gulp-jsdoc3');
const config = require('./jsdocConfig.json');

function buildDocs()
{
    return src(['./src/**/*.js'], {read: false})
        .pipe(jsdoc(config));
};

exports.default = buildDocs;