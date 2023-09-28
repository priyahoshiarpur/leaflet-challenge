// Define custom depth 
let depthColors = [
    { depth: 10, color: '#e7e34e' },
    { depth: 30, color: '#eabd3b' },
    { depth: 50, color: '#ee9a3a' },
    { depth: 70, color: '#ef7e32' },
    { depth: 100, color: '#de542c' },
    { depth: 150, color: '#c02323' },
    { depth: Infinity, color: '#820401' },
];

function getColorByDepth(depth) {
    let colorselection = depthColors.find(entry => depth <= entry.depth);
    return colorselection ? colorselection.color : '#820401';
}

// URL for Earthquake and Tectonic Plates GeoJSON Data
let eqURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let platesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";

// Create Map
let myMap = L.map("map", {
    center: [-6.1444, 134.5238],
    zoom: 4,
});

// Base Maps
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,\
     <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopo\
     Map</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

let baseMaps = {
    "Street Map": street,
    "Topo Map": topo
};

L.control.layers(baseMaps).addTo(myMap);

// Fetch Earthquake Data
fetch(eqURL)
    .then(response => response.json())
    .then(data => {
        let eqMarkers = data.features.map(feature => {
            let { coordinates } = feature.geometry;
            let depth = coordinates[2];
            let magnitude = feature.properties.mag;
            let place = feature.properties.place;
            let time = new Date(feature.properties.time);

            let eqMarker = L.circle([coordinates[1], coordinates[0]], {
                fillOpacity: 0.75,
                color: "white",
                fillColor: getColorByDepth(depth),
                radius: magnitude ** 3 * 2000
            }).bindPopup(`<h2>${place}</h2> <hr>\
                <body><b>Magnitude:</b> ${magnitude}</body><br>\
                <body><b>Depth:</b> ${depth}</body><br>\
                <body><b>Time:</b> ${time}</body>`);

            return eqMarker;
        });

        let eqLayer = L.layerGroup(eqMarkers).addTo(myMap);

        // Fetch Tectonic Plates Data
        fetch(platesURL)
            .then(response => response.json())
            .then(plates => {
                let tecPlates = L.geoJSON(plates, { style: { color: '#dfd98b', fillColor: 'none' } });
                tecPlates.addTo(myMap);

                // Legend
                let legend = L.control({ position: 'bottomright' });
                legend.onAdd = () => {
                    let div = L.DomUtil.create('div', 'info legend');
                    let labels = ["-10-10", "10-30", "30-50", "50-70", "80-110", "110-150", ">150"];
                    div.innerHTML = "<h2>Earthquake<br>Depth (km)</h2>";
                    labels.forEach((label, i) => {
                        div.innerHTML += `<li style="background-color: ${depthColors[i].color}"></li>${label}<ul>`;
                    });
                    return div;
                };
                legend.addTo(myMap);
            })
            .catch(error => {
                console.error("Error fetching plates data:", error);
            });
    })
    .catch(error => {
        console.error("Error fetching earthquake data:", error);
    });
