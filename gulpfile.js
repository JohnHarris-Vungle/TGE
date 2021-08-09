const { src, dest, series, parallel } = require('gulp');
const buildConfig = require('./buildConfig');
const del = require('del');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const jsdoc = require('gulp-jsdoc3');
const jsdocConfig = require('./jsdocConfig.json');

const outputFolder = "dist";

async function cleanOutputFolder(cb)
{
    await del.sync([outputFolder]);
    cb();
};

function buildDocs()
{
    return src(['./src/**/*.js'], {read: false})
        .pipe(jsdoc(jsdocConfig));
};

function buildAll(cb)
{
    buildVersion("core");
    buildVersion("1.1");
    buildVersion("1.2");
    cb();
};

function buildVersion(version)
{
    return src(buildConfig.files[version])
        .pipe(concat('tge-' + version + '.min.js'))
        .pipe(uglify())
        .pipe(dest(outputFolder));
};

exports.clean = cleanOutputFolder;
exports.docs = buildDocs;
exports.build = buildAll;
exports.default = buildDocs;