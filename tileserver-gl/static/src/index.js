import './style.css';
import $ from 'jquery';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function main() {
    var map = new mapboxgl.Map({
        container: 'map',
        zoom: 3,
        hash: true,
        center: [4.899, 52.372]
    });

    map.addControl(new mapboxgl.NavigationControl());

    map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
    }));

    map.addControl(new mapboxgl.FullscreenControl({
        container: document.querySelector('body')
    }));

    $.getJSON('/styles.json', function (json) {
        const layerList = $('#styles');
        json
            .map(style => `<input id="${style.name}" type="radio" name="rtoggle" value="${style.url}"><label for="${style.name}"><a href="${style.url}">${style.name}</a></label></br>`)
            .forEach(html => layerList.append(html));

        var inputs = $('input', layerList);
        map.setStyle(json[0].url);
        inputs.first().prop("checked", true);

        function switchLayer(layer) {
            var layerId = layer.target.value;
            map.setStyle(layerId);
        }

        for (var i = 0; i < inputs.length; i++) {
            inputs[i].onclick = switchLayer;
        }
    });

    $.getJSON('/rendered.json', function (json) {
        const rasterList = $('#raster');
        json
            .map((source, index) => `<input id="${source.name}" type="radio" name="rtoggle" value="${source.id}"><label for="${source.name}"><a href="/styles/${source.id}.json">${source.name}</a></label></br>`)
            .forEach(html => rasterList.append(html));

        var inputs = $('input', rasterList);

        function switchLayer(layer) {
            var layerId = layer.target.value;

            var style = {
                "version": 8,
                "sources": {
                    "raster-tiles": {
                        "type": "raster",
                        "url": `/styles/${layerId}.json`,
                        "tileSize": 256
                    }
                },
                "layers": [{
                    "id": "simple-tiles",
                    "type": "raster",
                    "source": "raster-tiles",
                }]
            };
            map.setStyle(style);
        }

        for (var i = 0; i < inputs.length; i++) {
            inputs[i].onclick = switchLayer;
        }
    });

    $.getJSON('/data.json', function (json) {
        var vectorList = $('#vector');
        json
            .filter(source => source.format.includes('pbf'))
            .map(source => `<a href="/data/${source.id}.json">${source.name}</a></br>`)
            .forEach(html => vectorList.append(html));
    });
}

$(document).ready(main)
