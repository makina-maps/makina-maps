const Promise = require('bluebird');

let core;

// Code inpired by https://github.com/maptiler/tileserver-gl/tree/master/src

/**
 * Web server (express) route handler to get styles, sprites and fronts
 * @param req request object
 * @param res response object
 * @param next will be called if request is not handled
 */
function sourceListHandler(req, res, next) {
  const start = Date.now();

  return Promise.try(() => Object.keys(core.getSources().getSourceConfigs())
    .map(source => ({ name: source, src: core.getSources().getSourceById(source) }))
    .filter(source => source.src.public && !source.src.isDisabled)
    .map(source => ({
      name: source.name,
      url: `/${source.name}/info.json`,
      formats: source.src.formats,
    }))
  ).then((data) => {
    core.setResponseHeaders(res);
    res.type('json').send(data);
    core.metrics.endTiming('sourceList', start);
  }).catch(err => core.reportRequestError(err, res)).catch(next);
}

module.exports = (cor, router) => {
  core = cor;

  router.get('/sources.json', sourceListHandler);
};
