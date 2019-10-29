const clone = require('clone');
const path = require('path');
const Err = require('@kartotherian/err');

function styleResolve(core, style, local = false) {
  const server_prefix = local ? core.getConfiguration().styles.prefix_internal : core.getConfiguration().styles.prefix_public;

  const styleConfig = core.getConfiguration().styles.styles[style];

  const stylesPath = core.getConfiguration().styles.paths.styles;
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
      if (styleConfig.sources_map) {
        sourceName = styleConfig.sources_map[sourceName] || sourceName;
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
