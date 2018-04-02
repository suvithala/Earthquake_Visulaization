
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var platesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});


function createFeatures(earthquakeData){
    // Function for each feature to be added as a popup describing the content in the popup
    function onEachFeature(feature,layer){
        layer.bindPopup("<h3>Place: " + feature.properties.place +
        "</h3><hr><h3>Magnitude: "+ feature.properties.mag +
        "</h3><hr><h3>Time: " + new Date(feature.properties.time) + "</h3>")
    }

    // Converting the earthquake data to geoJSON and setting the marker as circleMarkers 
    var earthquakes= L.geoJSON(earthquakeData,{
        onEachFeature: onEachFeature,
        pointToLayer: function(feature,latlng){
            return L.circleMarker(latlng,{
                radius: markersize(feature["properties"]["mag"]),
                color: markercolor(feature["properties"]["mag"]),
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8

            });
        }
    });
  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}


function markersize(magnitude) {
  return magnitude * 5;
}

// function markercolor(magnitude){
//     if(magnitude>=0 & magnitude<=1){
//         return "#80ff00";
//     }
//     else if(magnitude>1 & magnitude<=2){
//         return "#bfff00";
//     }
//     else if(magnitude>2 & magnitude<=3){
//         return "#ffff00";
//     }
//     else if(magnitude>3 & magnitude<=4){
//         return "#ffbf00";
//     }
//     else if(magnitude>4 & magnitude<=5){
//         return "#ff8000";
//     }
//     else if(magnitude>5){
//         return "#ff4000";
//     }
// }


function markercolor(magnitude) {
    return magnitude > 5 ? '#80ff00' :
           magnitude > 4 ? '#bfff00' :
           magnitude > 3 ? '#ffff00' :
           magnitude > 2 ? '#ffbf00' :
           magnitude > 1 ? '#ff8000' :
                           '#ff4000';
}

function createMap(earthquakes) {

  // Define streetmap and darkmap layers
  var outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/suvithala/cjeyil7ri1fbr2so59e01iq3w/tiles/256/{z}/{x}/{y}?" +
                              "access_token=pk.eyJ1Ijoic3V2aXRoYWxhIiwiYSI6ImNqZWo2ZDdweDB4OXozM25sbDIyd2I3YTIifQ.rtsx7ta73EbOG-KVPodUpQ");

  var greyscale = L.tileLayer("https://api.mapbox.com/styles/v1/suvithala/cjeyikli4252h2rqiz9vlphyc/tiles/256/{z}/{x}/{y}?" +
                            "access_token=pk.eyJ1Ijoic3V2aXRoYWxhIiwiYSI6ImNqZWo2ZDdweDB4OXozM25sbDIyd2I3YTIifQ.rtsx7ta73EbOG-KVPodUpQ");

  var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/suvithala/cjeyisicj1fwf2rt6jsma27c4/tiles/256/{z}/{x}/{y}?" +
                              "access_token=pk.eyJ1Ijoic3V2aXRoYWxhIiwiYSI6ImNqZWo2ZDdweDB4OXozM25sbDIyd2I3YTIifQ.rtsx7ta73EbOG-KVPodUpQ");

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Grey Scale": greyscale,
    "Outdoors": outdoors,
    "Satellite": satellite
  };

  var plates = new L.LayerGroup();

  d3.json(platesUrl,function(data){
        L.geoJSON(data,{
            color:"blue", 
            weight: 2
        }).addTo(plates);            
    })
  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": plates
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [37.09, -95.71],
    zoom: 5,
    layers: [greyscale, earthquakes, plates]
  });

  
  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map

  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

 
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (myMap) {

  var div = L.DomUtil.create('div', 'info legend'),
  magnitude = [0,1,2,3,4,5],
  labels = [];

  // loop through our density intervals and generate a label with a colored square for each interval
  for (var i = 0; i < magnitude.length; i++) {
    div.innerHTML +=
    '<i style="background:' + markercolor(magnitude[i] + 1) + '"></i> ' +
    magnitude[i] + (magnitude[i + 1] ? '&ndash;' + magnitude[i + 1] + '<br>' : '+');
    console.log(markercolor(magnitude[i]));
  }

  return div;
}
legend.addTo(myMap);
    
     
d3.json(queryUrl, function(data) {
  var getInterval = function(quake) {
  // earthquake data only has a time, so we'll use that as a "start"
  // and the "end" will be that + some value based on magnitude
  // 18000000 = 30 minutes, so a quake of magnitude 5 would show on the
  // map for 150 minutes or 2.5 hours
    return {
      start: quake.properties.time,
      end:   quake.properties.time + quake.properties.mag * 1800000
    };
  };
  var timelineControl = L.timelineSliderControl({
    formatOutput: function(date) {
      return new Date(date).toString();
    }
  });
  
  var timeline = L.timeline(data, {
    getInterval: getInterval,
    pointToLayer: function(data, latlng){
      var hue_min = 120;
      var hue_max = 0;
      var hue = data.properties.mag / 10 * (hue_max - hue_min) + hue_min;
        return L.circleMarker(latlng, {
          radius: data.properties.mag * 3,
          color: "hsl("+hue+", 100%, 50%)",
          fillColor: "hsl("+hue+", 100%, 50%)"
          }).bindPopup('<a href="'+data.properties.url+'">click for more info</a>');
        }
      });
  timelineControl.addTo(myMap);
  timelineControl.addTimelines(timeline);
  timeline.addTo(myMap);
  });

};

