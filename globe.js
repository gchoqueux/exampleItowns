/* global itowns, document, renderer */
// # Simple Globe viewer

// Define initial camera position
var positionOnGlobe = { longitude: 4.2165, latitude: 44.844, altitude: 3000 };
var promises = [];
var miniView;
var minDistance = 10000000;
var maxDistance = 30000000;

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');
var miniDiv = document.getElementById('miniDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer });
function addLayerCb(layer) {
    return globeView.addLayer(layer);
}

// Dont' instance mini viewer if it's Test env
if (!renderer) {
    miniView = new itowns.GlobeView(miniDiv, positionOnGlobe, {
        // `limit globe' subdivision level:
        // we're don't need a precise globe model
        // since the mini globe will always be seen from a far point of view (see minDistance above)
        maxSubdivisionLevel: 2,
        // Don't instance default controls since miniview's camera will be synced
        // on the main view's one (see globeView.addFrameRequester)
        noControls: true,
    });

    // Set a 0 alpha clear value (instead of the default '1')
    // because we want a transparent background for the miniglobe view to be able
    // to see the main view "behind"
    miniView.mainLoop.gfxEngine.renderer.setClearColor(0x000000, 0);

    // update miniview's camera with the globeView's camera position
    globeView.addFrameRequester(itowns.MAIN_LOOP_EVENTS.AFTER_RENDER, function updateMiniView() {
        // clamp distance camera from globe
        var distanceCamera = globeView.camera.camera3D.position.length();
        var distance = Math.min(Math.max(distanceCamera * 1.5, minDistance), maxDistance);
        var camera = miniView.camera.camera3D;
        // Update target miniview's camera
        camera.position.copy(globeView.controls.moveTarget()).setLength(distance);
        camera.lookAt(globeView.controls.moveTarget());
        miniView.notifyChange(true);
    });

    // Add one imagery layer to the miniview
    itowns.Fetcher.json('./node_modules/itowns/examples/layers/JSONLayers/Ortho.json').then(function _(layer) { miniView.addLayer(layer); });
}

// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./node_modules/itowns/examples/layers/JSONLayers/Ortho.json').then(addLayerCb));
// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./node_modules/itowns/examples/layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promises.push(itowns.Fetcher.json('./node_modules/itowns/examples/layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));


function loadCollada(url) {
    var model;
    console.log('model', model);
    // loading manager
    var loadingManager = new itowns.THREE.LoadingManager(function _addModel() {
        globeView.scene.add(model);
        globeView.notifyChange(true);
    });
    // collada loader
    var loader = new itowns.THREE.ColladaLoader(loadingManager);

    // building coordinate
    var coord = new itowns.Coordinates('EPSG:4326', 4.2165, 44.844, 1417);

    loader.load(url, function col(collada) {
        var colladaID = globeView.mainLoop.gfxEngine.getUniqueThreejsLayer();
        model = collada.scene;
        model.position.copy(coord.as(globeView.referenceCrs).xyz());
        // align up vector with geodesic normal
        model.lookAt(model.position.clone().add(coord.geodesicNormal));
        // user rotate building to align with ortho image
        model.rotateZ(-Math.PI * 0.2);
        model.scale.set(1.2, 1.2, 1.2);

        // set camera's layer to do not disturb the picking
        model.traverse(function _(obj) { obj.layers.set(colladaID); });
        globeView.camera.camera3D.layers.enable(colladaID);

        // update coordinate of the mesh
        model.updateMatrixWorld();
    });
};

var script = document.createElement('script');
var THREE = itowns.THREE;
script.type = 'text/javascript';
script.src = 'https://cdn.rawgit.com/mrdoob/three.js/r' + THREE.REVISION + '/examples/js/loaders/ColladaLoader.js';
script.onload = function l() {
    loadCollada('https://raw.githubusercontent.com/iTowns/iTowns2-sample-data/master/models/collada/building.dae');
};
document.body.appendChild(script);

exports.view = globeView;
exports.initialPosition = positionOnGlobe;
