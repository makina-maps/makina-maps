import "./style.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

function getHashParam(hashParameterName) {
    let dummyURL = new URL("https://dummy.com");
    dummyURL.search = window.location.hash.substring(1);
    return dummyURL.searchParams.get(hashParameterName);
}

function setHashParam(hashParameterName, hashParameterValue) {
    let dummyURL = new URL("https://dummy.com");
    dummyURL.search = window.location.hash.substring(1);
    dummyURL.searchParams.set(hashParameterName, hashParameterValue);
    window.location.hash = dummyURL.search
        .substring(1)
        .replace("%2F", "/")
        .replace("%2F", "/");
}

function setHashStyle(style) {
    setHashParam("style", style.split("/").splice(-2)[0]);
}

fetch("/styles.json")
    .then((result) => result.json())
    .then((json) => {
        const layerList = document.getElementById("styles");
        json.map(
            (style) =>
                `<input id="${style.id}" type="radio" name="rtoggle" value="${style.url}">` +
                `<label for="${style.name}"><a href="${style.url}">${style.name}</a></label>` +
                (style.hasOwnProperty("source:url") &&
                !style["source:url"].startsWith("mapbox://")
                    ? ` <a href="${style["source:url"]}" title="Link to style source." target="_blank">⮊</a>`
                    : "") +
                `</br>`
        ).forEach((html) => layerList.insertAdjacentHTML("beforeend", html));

        const inputs = layerList.querySelectorAll("input");
        const radiobtn = document.getElementById(getHashParam("style"));
        if (radiobtn) {
            radiobtn.checked = true;
            map.setStyle(radiobtn.value);
        } else {
            map.setStyle(json[0].url);
            inputs[0].checked = true;
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

fetch("/rendered.json")
    .then((response) => response.json())
    .then((json) => {
        const rasterList = document.getElementById("raster");
        json.map(
            (source) => `
            <input id="${source.id}" type="radio" name="rtoggle" value="${source.id}">
            <label for="${source.id}"><a href="/styles/${source.id}.json">${source.name}</a> <a href="/styles/${source.id}/wmts.xml">WMTS</a></label>
            </br>`
        ).forEach((html) => rasterList.insertAdjacentHTML("beforeend", html));

        const inputs = rasterList.querySelectorAll("input");

        function switchLayer(layer) {
            const layerId = layer.target.value;

            const style = {
                version: 8,
                sources: {
                    "raster-tiles": {
                        type: "raster",
                        url: `/styles/${layerId}.json`,
                    },
                },
                layers: [
                    {
                        id: "simple-tiles",
                        type: "raster",
                        source: "raster-tiles",
                    },
                ],
            };
            map.setStyle(style);
        }

        for (var i = 0; i < inputs.length; i++) {
            inputs[i].onclick = switchLayer;
        }
    });

fetch("/data.json")
    .then((response) => response.json())
    .then((json) => {
        const vectorList = document.getElementById("vector");
        json.filter((source) => !source.format || source.format.includes("pbf"))
            .map(
                (source) =>
                    `<a href="/data/${source.id}.json">${source.name}</a></br>`
            )
            .forEach((html) =>
                vectorList.insertAdjacentHTML("beforeend", html)
            );
    });

const map = new mapboxgl.Map({
    container: "map",
    zoom: 3,
    hash: "map",
    center: [4.899, 52.372],
});

map.addControl(new mapboxgl.NavigationControl());

map.addControl(
    new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: "metric",
    })
);

map.addControl(
    new mapboxgl.FullscreenControl({
        container: document.querySelector("body"),
    })
);

const menu = document.getElementById("menu");
const button_close = document.getElementById("button-close");
const button_open = document.getElementById("button-open");

button_close.addEventListener("click", (event) => {
    button_close.style.display = "none";
    menu.style.display = "none";
    button_open.style.display = "";
});

button_open.addEventListener("click", (event) => {
    button_open.style.display = "none";
    button_close.style.display = "";
    menu.style.display = "";
});
