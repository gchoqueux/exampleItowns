var Cesium = require('cesium/Cesium');
require('cesium/Widgets/widgets.css');

var viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain()
});

var tileset = new Cesium.Cesium3DTileset({
    // url: Cesium.IonResource.fromAssetId(6074)
    // url: './Building/tileset.json',
    url: 'https://itowns.ign.fr/demos/SCV-3DTiles/Cache3DTiles_SCV_301018/root.json',
});

viewer.scene.primitives.add(tileset);
viewer.zoomTo(tileset);
