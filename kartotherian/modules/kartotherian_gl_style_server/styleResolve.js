const fs = require('fs');
const path = require('path');
const Err = require('@kartotherian/err');

function styleResolve(core, config, style, local = false) {
  const serverPrefix = local ? config.prefix_internal : config.prefix_public;
  const stylesPath = config.paths.styles;

  if (!config.styles[style]) {
    throw new Err(`"styles" configuration does not define style "${style}"`);
  }
  const styleConfig = config.styles[style];

  if (!styleConfig.style) {
    throw new Err(`"style" configuration does not define relative path for style "${style}"`);
  }
  const styleRelativePath = styleConfig.style;

  const styleFile = path.resolve(stylesPath, styleRelativePath);
  const styleJSON = JSON.parse(fs.readFileSync(styleFile, 'utf8'));

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
      const sourceMap = local ? styleConfig.sources_map_internal : styleConfig.sources_map;
      if (sourceMap) {
        sourceName = sourceMap[sourceName] || sourceName;
      }
      try {
        // Check if style is available
        if (!local) {
          core.getPublicSource(sourceName);
        }
      } catch (err) {
        throw new Err(`Public source identifier "${sourceName}" not found in sources mapping or sources list.`);
      }

      source.url = `${serverPrefix}/${sourceName}/info.json`;
    }
  });

  const httpTester = /^(http(s)?:)?\/\//;
  if (styleJSON.sprite && !httpTester.test(styleJSON.sprite)) {
    if (local) {
      const spritePath = path.resolve(path.dirname(styleFile), 'sprite');
      styleJSON.sprite = `file://${spritePath}`;
    } else {
      styleJSON.sprite = `${serverPrefix}/styles/${style}/sprite`;
    }
  }
  if (styleJSON.glyphs && !httpTester.test(styleJSON.glyphs)) {
    styleJSON.glyphs = `${serverPrefix}/fonts/{fontstack}/{range}.pbf`;
  }

  return styleJSON;
}

module.exports = styleResolve;
