var itowns = require('itowns');
var meshes = [];

// Define initial camera position
var positionOnGlobe = { longitude: 1.5, latitude: 43, altitude: 300000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var view = new itowns.GlobeView(viewerDiv, positionOnGlobe);

function addLayerCb(layer) {
    view.addLayer(layer);
}

// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
itowns.Fetcher.json('./node_modules/itowns/examples/layers/JSONLayers/Ortho.json').then(addLayerCb)

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
itowns.Fetcher.json('./node_modules/itowns/examples/layers/JSONLayers/WORLD_DTM.json').then(addLayerCb);
itowns.Fetcher.json('./node_modules/itowns/examples/layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb);

var color = new itowns.THREE.Color();
function colorBuildings(properties) {
    if (properties.id.indexOf('bati_remarquable') === 0) {
        return color.set(0x5555ff);
    } else if (properties.id.indexOf('bati_industriel') === 0) {
        return color.set(0xff5555);
    }
    return color.set(0xeeeeee);
}

function altitudeBuildings(properties) {
    return properties.z_min - properties.hauteur;
}

function extrudeBuildings(properties) {
    return properties.hauteur;
}

function acceptFeature(properties) {
    return !!properties.hauteur;
}

scaler = function update(/* dt */) {
    var i;
    var mesh;
    if (meshes.length) {
        view.notifyChange(view.camera.camera3D, true);
    }
    for (i = 0; i < meshes.length; i++) {
        mesh = meshes[i];
        if (mesh) {
            mesh.scale.z = Math.min(
                1.0, mesh.scale.z + 0.02);
            mesh.updateMatrixWorld(true);
        }
    }
    meshes = meshes.filter(function filter(m) { return m.scale.z < 1; });
};

view.addFrameRequester(itowns.MAIN_LOOP_EVENTS.BEFORE_RENDER, scaler);
view.addLayer({
    id: 'WFS Buildings',
    type: 'geometry',
    update: itowns.FeatureProcessing.update,
    convert: itowns.Feature2Mesh.convert({
        color: colorBuildings,
        altitude: altitudeBuildings,
        extrude: extrudeBuildings }),
    onMeshCreated: function scaleZ(mesh) {
        mesh.scale.z = 0.01;
        meshes.push(mesh);
    },
    filter: acceptFeature,
    source: {
        url: 'http://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/wfs?',
        protocol: 'wfs',
        version: '2.0.0',
        typeName: 'BDTOPO_BDD_WLD_WGS84G:bati_remarquable,BDTOPO_BDD_WLD_WGS84G:bati_indifferencie,BDTOPO_BDD_WLD_WGS84G:bati_industriel',
        projection: 'EPSG:4326',
        ipr: 'IGN',
        format: 'application/json',
        zoom: { min: 14, max: 14 },
        extent: {
            west: 4.568,
            east: 5.18,
            south: 45.437,
            north: 46.03,
        },
    }
});
