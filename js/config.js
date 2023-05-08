
util = new Util();
markers = new Markers();
uriParms = {};
isMobile = false;


defaultMapOpts = {
   center: { lat: 38.925229, lng: -97.558594 }
   ,minZoom: 1
   ,maxZoom: 20
   ,zoom: 5
   ,url: "./?"
}

const trail = [
   {
      id: 'lowRes'
      ,url: './data/vector/APTlow_2023v1.3.fgb'
      ,minZoom: 1
      ,maxZoom: 13
      ,loadingId: 'loading'
      ,name: ''
      ,style: { color: '#51215a', weight: 2, zIndex: 3000 }
      ,update: 1
      /* Using the callback function */
   ,featureFn:  function (layer, feature, opts) {
      switch(feature.properties.status) {
          case 'Partner':
             opts.style.color = '#51215a';
             opts.style.dashArray = '';
             break;
          case 'Proposed':
             opts.style.color = '#51215a';
             opts.style.dashArray = '2, 5';
             break;
          case 'PGC':
             opts.style.color = '#FFA500';
             opts.style.dashArray = '2, 5';
             break;
          default:
             opts.style.color = '#FF00FF';
      }
      var f = L.geoJSON(feature, { style: opts.style });
         // below is the only new line. Use feature.properties.label to get the label
         //layer.setText(feature.properties.label);
      f.addTo(layer);
    }
   }
   ,{
      id: 'highRes'
      ,url: './data/vector/APThigh_2023v1.3.fgb'
      ,minZoom: 14
      ,maxZoom: 20
      ,loadingId: 'loading'
      ,update: 2
      ,bbox: 'viewport'
      ,pad: .05
      ,name: ''
      ,style: { color: '#51215a', weight: 4, zIndex: 3000 }
       /* Using the callback function */
   ,featureFn:  function (layer, feature, opts) {
      switch(feature.properties.status) {
          case 'Partner':
             opts.style.color = '#51215a';
             opts.style.dashArray = '';
             break;
          case 'Proposed':
             opts.style.color = '#51215a';
             opts.style.dashArray = '1, 10';
             break;
          case 'PGC':
             opts.style.color = '#FFA500';
             opts.style.dashArray = '1, 10';
             break;
          default:
             opts.style.color = '#FF00FF';
      }
      var f = L.geoJSON(feature, { style: opts.style });
         // below is the only new line. Use feature.properties.label to get the label
         // layer.setText(feature.properties.label);
      f.addTo(layer);
    }
   }
];

groups = [
   {
      id: "basemaps"
      ,name: "Base Maps"
      ,opt: "radio"
      ,layers: [
         { 
            id: "esri"
            ,name: "ESRI World Topo"
            ,selected: 1
            ,layers: [
               {
                  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
                  ,type: "WMTS"
                  ,minZoom: 1
                  ,maxZoom: 20
                  ,attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
               }
            ]
         }
         ,{
            id: "esri_img"
            ,name: "ESRI Imagery"
            ,selected: 0
            ,layers: [
               {
                  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                  ,type: "WMS"
                  ,minZoom: 1
                  ,maxZoom: 20
                  ,attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
               }
            ]
         }
         ,{
            id: "stamen"
            ,name: "Stamen Terrain"
            ,selected: 0
            ,layers: [
               {
                  url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}'
                  ,subdomains: 'abcd'
                  ,type: "WMS"
                  ,minZoom: 0
                  ,maxZoom: 20
                  ,attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  ,ext: 'png'
               }
            ]
         }
         ,{
            id: "bmnone"
            ,name: "None"
            ,selected: 0
            ,layers: [
               {
                  url: ""
               }
            ]
         }
      ]
   }
];


