const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const Err = require('@kartotherian/err');
const styleResolve = require('./styleResolve');

let core;

// Code inpired by https://github.com/maptiler/tileserver-gl/tree/master/src

/**
 * Web server (express) route handler to get styles, sprites and fronts
 * @param req request object
 * @param res response object
 * @param next will be called if request is not handled
 */
function styleHandler(req, res, next) {
  const start = Date.now();
  const { params } = req;

  return Promise.try(() =>
    styleResolve(core, params.style)
  ).then((data) => {
    core.setResponseHeaders(res);
    res.type('json').send(data);
    core.metrics.endTiming('styles', start);
  }).catch(err => core.reportRequestError(err, res)).catch(next);
}

function spritesHandler(req, res, next) {
  const start = Date.now();
  const { params } = req;

  return Promise.try(() => {
    const stylesPath = core.getConfiguration().styles.paths.styles;
    const styleDir = path.dirname(core.getConfiguration().styles.styles[params.style].style);
    const filename = 'sprite' + (params.scale || '') + '.' + params.format;
    const spriteFile = path.resolve(stylesPath, styleDir, filename);

    try {
      return fs.readFileSync(spriteFile);
    } catch (error) {
      throw new Err('File not found' + spriteFile);
    }
  }).then((data) => {
    core.setResponseHeaders(res);
    res.type(params.format).send(data);
    core.metrics.endTiming('sprites', start);
  }).catch(err => core.reportRequestError(err, res)).catch(next);
}

function fontsHandler(req, res, next) {
  const start = Date.now();
  const { params } = req;

  return Promise.try(() => {
    const fontFile = path.resolve(core.getConfiguration().styles.paths.fonts, params.fontstack, params.range + '.pbf');

    try {
      return fs.readFileSync(fontFile);
    } catch (error) {
      throw new Err('File not found');
    }
  }).then((data) => {
    core.setResponseHeaders(res);
    res.header('Content-type', 'application/x-protobuf').send(data);
    core.metrics.endTiming('fonts', start);
  }).catch(err => core.reportRequestError(err, res)).catch(next);
}

function fontsListHandler(req, res, next) {
  const start = Date.now();

  return Promise.try(() => {
    const fontsPath = core.getConfiguration().styles.paths.fonts;
    const fonts = [];
    fs.readdirSync(fontsPath).forEach((file) => {
      const stats = fs.lstatSync(path.resolve(fontsPath, file));
      // TODO check SymbolicLink is to directory
      if (stats.isDirectory() || stats.isSymbolicLink()) {
        fonts.push(file + '.ttf');
      }
    });

    return fonts;
  }).then((data) => {
    core.setResponseHeaders(res);
    res.type('json').send(data);
    core.metrics.endTiming('fontsList', start);
  }).catch(err => core.reportRequestError(err, res)).catch(next);
}

module.exports = (cor, router) => {
  core = cor;

  router.get('/styles/:style/style.json', styleHandler);
  router.get('/styles/:style/sprite:scale(@[23]x)?\.:format([\\w]+)', spritesHandler);

  router.get('/fonts/:fontstack/:range([\\d]+-[\\d]+).pbf', fontsHandler);
  router.get('/fonts.json', fontsListHandler);
};
