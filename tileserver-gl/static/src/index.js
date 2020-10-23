import './style.css';
import $ from 'jquery';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function getHashParam(hashParameterName) {
    let dummyURL = new URL('https://dummy.com');
    dummyURL.search = window.location.hash.substring(1);
    return dummyURL.searchParams.get(hashParameterName);
}

function setHashParam(hashParameterName, hashParameterValue) {
    let dummyURL = new URL('https://dummy.com');
    dummyURL.search = window.location.hash.substring(1);
    dummyURL.searchParams.set(hashParameterName, hashParameterValue);
    window.location.hash = dummyURL.search.substring(1).replace('%2F', '/').replace('%2F', '/');
}

function setHashStyle(style) {
    setHashParam('style', style.split("/").splice(-2)[0]);
}

function main() {
    const map = new mapboxgl.Map({
        container: 'map',
        zoom: 3,
        hash: 'map',
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
            .map(style => `<input id="${style.id}" type="radio" name="rtoggle" value="${style.url}">` +
                `<label for="${style.name}"><a href="${style.url}">${style.name}</a></label>` +
                (style.hasOwnProperty('source:url') && !style['source:url'].startsWith('mapbox://') ? ` <a href="${style['source:url']}" title="Link to style source." target="_blank">⮊</a>` : '') +
                `</br>`)
            .forEach(html => layerList.append(html));

        const inputs = $('input', layerList);
        const radiobtn = document.getElementById(getHashParam('style'));
        if (radiobtn) {
            radiobtn.checked = true;
            map.setStyle(radiobtn.value);
        } else {
            map.setStyle(json[0].url);
            inputs.first().prop("checked", true);
        }

        function switchLayer(layer) {
            const layerId = layer.target.value;
            setHashStyle(layerId);
            map.setStyle(layerId);
        }

        for (var i = 0; i < inputs.length; i++) {
            inputs[i].onclick = switchLayer;
        }
    });

    $.getJSON('/rendered.json', function (json) {
        const rasterList = $('#raster');
        json
            .map(source => `
            <input id="${source.id}" type="radio" name="rtoggle" value="${source.id}">
            <label for="${source.id}"><a href="/styles/${source.id}.json">${source.name}</a> <a href="/styles/${source.id}/wmts.xml">WMTS</a></label>
            </br>`)
            .forEach(html => rasterList.append(html));

        const inputs = $('input', rasterList);

        function switchLayer(layer) {
            const layerId = layer.target.value;

            const style = {
                "version": 8,
                "sources": {
                    "raster-tiles": {
                        "type": "raster",
                        "url": `/styles/${layerId}.json`
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
        const vectorList = $('#vector');
        json
            .filter(source => !source.format || source.format.includes('pbf'))
            .map(source => `<a href="/data/${source.id}.json">${source.name}</a></br>`)
            .forEach(html => vectorList.append(html));
    });
}

$(document).ready(main)
