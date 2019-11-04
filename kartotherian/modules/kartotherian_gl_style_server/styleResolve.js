const clone = require('clone');
const path = require('path');
const Err = require('@kartotherian/err');

function styleResolve(core, style, local = false) {
  config = core.getConfiguration().styles;

  if (!config) {
    throw new Err('"styles" configuration block is not set up in the config');
  }

  if (!config.prefix_internal || !config.prefix_public) {
    throw new Err('"styles" configuration must specify "prefix_internal" and "prefix_public"');
  }
  const server_prefix = local ? config.prefix_internal : config.prefix_public;

  if (!config.paths || !config.paths.styles) {
    throw new Err('"styles" configuration must specify "paths.styles"');
  }
  const stylesPath = config.paths.styles;

  if (!config.styles) {
    throw new Err('"styles" configuration must specify a "styles" list');
  }
  if (!config.styles[style]) {
    throw new Err(`"styles" configuration does not define style "${style}"`);
  }
  const styleConfig = config.styles[style];

  if (!styleConfig.style) {
    throw new Err(`"style" configuration does not define relative path for style "${style}"`);
  }
  const styleRelativePath = styleConfig.style;

  const styleFile = path.resolve(stylesPath, styleRelativePath);
  const styleJSON = clone(require(styleFile));

  Object.keys(styleJSON.sources).forEach((name) => {
    const source = styleJSON.sources[name];
    const { url } = source;
    if (url && url.lastIndexOf('mbtiles:', 0) === 0) {
      let mbtilesFile = url.substring('mbtiles://'.length);
      const fromData = mbtilesFile[0] === '{' &&
        mbtilesFile[mbtilesFile.length - 1] === '}';

      if (fromData) {
        mbtilesFile = mbtilesFile.substr(1, mbtilesFile.length - 2);
      }

      let sourceName = mbtilesFile;
      const source_map = local ? styleConfig.sources_map_internal : styleConfig.sources_map;
      if (source_map) {
        sourceName = source_map[sourceName] || sourceName;
      }
      try {
        // Check if style is available
        if (!local) {
          core.getPublicSource(sourceName);
        }
      } catch (err) {
        throw new Err(`Public source identifier "${sourceName}" not found in sources mapping or sources list.`);
      }

      source.url = server_prefix + '/' + sourceName + '/info.json';
    }
  });

  const httpTester = /^(http(s)?:)?\/\//;
  if (styleJSON.sprite && !httpTester.test(styleJSON.sprite)) {
    if (local) {
      styleJSON.sprite = 'file://' + path.resolve(path.dirname(styleFile), 'sprite');
    } else {
      styleJSON.sprite = server_prefix + '/styles/' + style + '/sprite';
    }
  }
  if (styleJSON.glyphs && !httpTester.test(styleJSON.glyphs)) {
    styleJSON.glyphs = server_prefix + '/fonts/{fontstack}/{range}.pbf';
  }

  return styleJSON;
}

module.exports = styleResolve;
