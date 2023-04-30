
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
      ,style: { color: '#51215a', weight: 2, zIndex: 3000 }
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
            id: "usgs"
            ,name: "USGS Imagery"
            ,selected: 0
            ,layers: [
               {
                  url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}'
                  ,type: "WMS"
                  ,minZoom: 1
                  ,maxZoom: 20
                  ,attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
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


