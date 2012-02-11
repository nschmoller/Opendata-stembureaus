var map, layer;

function init(){

  format = 'image/png';

  var options = {
    projection: new OpenLayers.Projection("EPSG:900913"),
    units: "m",
    maxResolution: 156543.0339,
    maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
        20037508.34, 20037508.34)
  };

  map = new OpenLayers.Map('map', options);

  // create WMS layer
  var gem = new OpenLayers.Layer.WMS(
      "CBS - Gemeente",
      "http://192.168.100.79:8080/geoserver/esd/wms",
      {'layers': 'esd:gemeente', 'styles': '', 'transparent': true}
      );

  var wijk = new OpenLayers.Layer.WMS(
      "CBS - Wijk",
      "http://192.168.100.79:8080/geoserver/esd/wms",
      {'layers': 'esd:wijk', 'styles': '', 'transparent': true}
      );

  var buurt = new OpenLayers.Layer.WMS(
      "CBS - Buurt",
      "http://192.168.100.79:8080/geoserver/esd/wms",
      {'layers': 'esd:buurt', 'styles': '', 'transparent': true}
      );

  //map.addLayer(gem);
  //map.addLayer(wijk);
  //map.addLayer(buurt);

  var osm = new OpenLayers.Layer.OSM( "Simple OSM Map");
  map.addLayer(osm);

  var top25_wm = new OpenLayers.Layer.OSM( "Top25 (WM)",
      "http://192.168.100.79/Top25_wm/${z}/${x}/${y}.jpg",
      {sphericalMercator: true} );
  map.addLayer(top25_wm);


  map.addControl(new OpenLayers.Control.LayerSwitcher());

  map.setCenter(createLonLat(6.9, 52.22), 12);

  window.vectorLayer = new OpenLayers.Layer.Vector("Overlay");
  map.addLayer(vectorLayer);
}

function addALocation(lon, lat) {
  if (lon === 0.0 && lat === 0.0) {
    return;
  }
  var lonlat = createLonLat(lon, lat);
  var feature = new OpenLayers.Feature.Vector(
      new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat),
      {some:'data'},
      {externalGraphic: 'marker.png', graphicHeight: 40, graphicWidth: 40});
  vectorLayer.addFeatures(feature);
}

function createLonLat(lon, lat) {
    return new OpenLayers.LonLat(lon, lat).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
        );
}


function showStembureaus() {
  $.getJSON('Stemdistrict-stembureau_getall.json', function(data) {
    _.each(data, function(item) {
      addALocation(item['longitude'], item['latitude']);
    });
  }).error(function(jqhr, textStatus, errorThrown) {
    console.log(textStatus);
    console.log(errorThrown);
  });
}

function showBuurten() {
  $.getJSON('cbs.json', function(data) {
    _.each(data, function(item) {
      var polygon = createPolygon(item['geo_data']);
      //var opacity = item['cbs_data']['Personen met laag inkomen'] / 100;
      var opacity = item['cbs_data']['65 jaar en ouder'] / 100;
      if (item['cbs_data']['Aantal inwoners'] < 500) {
        opacity = 0.0;
      }
      var vector = new OpenLayers.Feature.Vector(polygon, {some: 'data'}, {fillOpacity: opacity, fillColor: '#ff0000'});
      vectorLayer.addFeatures(vector);
    });
  }).error(function(jqhr, textStatus, errorThrown) {
    console.log(textStatus);
    console.log(errorThrown);
  });
}

function createPolygon(coordinates) {
  var points = [];
  _.each(coordinates, function(coord) {
    var lonlat = createLonLat(coord[1], coord[0]);
    points.push(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)); 
  });
  var ring = new OpenLayers.Geometry.LinearRing(points);
  var polygon = new OpenLayers.Geometry.Polygon(ring);
  return polygon;
}

$(function() {
  init();
  showBuurten();
  showStembureaus();
  
  //var polygon = createPolygon([[52.22, 6.9], [52.1, 6.9], [52.22, 6.7]]);
  //var vector = new OpenLayers.Feature.Vector(polygon, {some: 'data'}, {fillColor: '#ff0000', fill: true});
  //vectorLayer.addFeatures(vector);
});
