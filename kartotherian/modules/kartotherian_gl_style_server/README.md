[![Build Status](https://travis-ci.org/frodrigo/kartotherian_gl_style_requestHandlers.svg?branch=master)](https://travis-ci.org/frodrigo/kartotherian_gl_style_requestHandlers)

# Kartotherian GL Style requestHandlers

The GL Styles handling components of the Kartotherian maps tile service

See [Kartotherian](https://github.com/kartotherian/kartotherian)

## Configuration

```yaml
services:
  - name: kartotherian
    conf:

      styles:
        prefix_public: http://localhost:6533
        prefix_internal: http://kartotherian:6533
        paths:
          styles: /styles
          fonts: /fonts
        styles:
          basic:
            style: klokantech-basic-gl-style/style-local.json
            sources_map:
              v3: openmaptiles_v3
            sources_map_internal:
              v3: openmaptiles_v3_raster
```
