
util = new Util();
markers = new Markers();
uriParms = {};
isMobile = false;

defaultMapOpts = {
   center: { lat: 37.205, lng: -118.805 }
   ,minZoom: 1
   ,maxZoom: 18
   ,zoom: 9
   ,url: "./?"
}

const trail = [
   {
      id: 'lowRes'
      ,url: './data/vector/CaliforniaPrimary_lowrez_v1.3.fgb'
      ,minZoom: 1
      ,maxZoom: 12
      ,loadingId: 'loading'
      ,name: ''
      ,style: { color: '#51215a', weight: 3, zIndex: 3000 }
      ,update: 1
   }
   ,{
      id: 'highRes'
      ,url: './data/vector/APThigh_2023v1.3.fgb'
      ,minZoom: 13
      ,maxZoom: 20
      ,loadingId: 'loading'
      ,update: 2
      ,bbox: 'viewport'
      ,pad: .05
      ,name: ''
      ,style: { color: '#51215a', weight: 3, zIndex: 3000 }
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
   ,{
      id: "markers"
      ,name: "Points of Interest"
      ,opt: "checkbox"
      ,layers: [
         {
            id: "milemarkers"
            ,name: 'Mile Markers'
            ,color: "#964B00"
            ,visible: 1
            ,layers: [
               {
                  url: './data/vector/milemarkers_lowres.fgb'
                  ,type: "FGB"
                  ,featureFn: markers.mileMarkerFn
                  ,update: 2
                  ,pad: .01
                  ,minZoom: 1
                  ,maxZoom: 9
                  ,className: 'milemarker'
                  ,color: "#964B00"
               }
               ,{
                  url: './data/vector/milemarkers_hires.fgb'
                  ,type: "FGB"
                  ,featureFn: markers.mileMarkerFn
                  ,update: 2
                  ,pad: .01
                  ,minZoom: 10
                  ,maxZoom: 20
                  ,className: 'milemarker'
                  ,color: "#964B00"
               }
            ]
         }
      ]
   }
   ,{
      id: "rasters"
      ,name: "Climate"
      ,opt: "checkbox"
      ,layers: [
         {
            id: "annprec"
            ,name: 'Annual Precipitation'
            ,color: "#000000"
            ,legendClass: 'legendClass'
            ,legend: {
               id: "annprecLegend"
               ,title: "<strong>Annual Rain<br>IN&nbsp;(mm)</strong>"
               ,colors: "#ff77ff,#ff00ff,#ff0020,#ff1400,#ff3c00,#ff6400,#ff8c00,#ffb400,#ffdc00,#fdff00,#65ff00,#00ff36,#00ffd0,#00c4ff,#0084ff,#0044ff,#0002ff"
               ,values: "0,1,2,3,4,5,7,10,15,20,25,35,50,75,100,150,200,250"
               ,thickness: "15px"
               ,opacity: .4
               ,style: "height: 325px; padding: 5px; margin: 0px; background-color: white; border: 1px solid black;"
               ,labelStyleFn:  function (index = null, self = null) {
                  var i = self.values[index];
                  var m = self.values[index] / 0.0393701;
                  return self.format("{0}&nbsp;({1})", i.toFixed(0), m.toFixed(0));
               }
            }
            ,layers: [
               {
                  url: "./data/raster/prec_annual.tif"
                  ,id: "annprec"
                  ,type: "COG"
                  ,loadingId: 'loading'
                  ,fn: util.rangePalette
                  ,colors: ["#ff77ff","#ff00ff","#ff0020","#ff1400","#ff3c00","#ff6400","#ff8c00","#ffb400","#ffdc00","#fdff00","#65ff00","#00ff36","#00ffd0","#00c4ff","#0084ff","#0044ff","#0002ff"]
                  ,values: [0,1,2,3,4,5,7,10,15,20,25,35,50,75,100,150,200,250]
                  ,noDataValue: -9999
                  ,minValue: 1 
                  ,minDataValue: 1
                  ,maxValue: 250
                  ,maxDataValue: 250
                  ,opacity: .4
                  ,mapId: 'map'
                  ,title: ''
                  ,valueScaleFn: function (v = null) { return (v * .001) * 25.4; }
                  ,legendClass: 'legend'
                  ,attribution: '<a href="https://www.noaa.gov/" target="_blank">NOAA</a>'
               }
            ]
         }
      ]
   }
];


