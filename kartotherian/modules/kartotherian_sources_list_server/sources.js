const Promise = require('bluebird');

let core;
let config;

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
      url: `${config.prefix_public}/${source.name}/info.json`,
      formats: source.src.formats,
    }))
  ).then((data) => {
    core.setResponseHeaders(res);
    res.type('json').send(data);
    core.metrics.endTiming('sourceList', start);
  }).catch(err => core.reportRequestError(err, res)).catch(next);
}

module.exports = (cor, router) => Promise.try(() => {
  core = cor;

  config = core.getConfiguration().sources_server;

  if (!config) {
    throw new Err('"sources" configuration block is not set up in the config');
  }

  if (!config.prefix_public) {
    throw new Err('"sources" configuration must specify "prefix_public"');
  }
}).then(() => {
  router.get('/sources.json', sourceListHandler);
});
