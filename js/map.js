
async function initMap(vopts = {}) {
   isMobile = L.Browser.mobileWebkit || L.Browser.mobile ? true : false; 

   var opts = Object.assign(
      defaultMapOpts
      ,vopts
   );
   uriParms.bmlayers = [];

   loadLayerGroups('groups');

   uriParms = parseUri(uriParms);
   uriParms['lat'] = 'lat' in uriParms ? uriParms.lat : defaultMapOpts.center.lat;
   uriParms['lon'] = 'lon' in uriParms ? uriParms.lon : defaultMapOpts.center.lng;
   uriParms['zoom'] = 'zoom' in uriParms ? uriParms.zoom : defaultMapOpts.center.zoom;
   uriParms['vw'] = ('vw' in uriParms) && parseInt(uriParms.vw) > -1 && parseInt(uriParms.vw) < groups[0].layers.length ? parseInt(uriParms.vw) : -1;

   gps = new GPS(defaultMapOpts.gpsOpts);

   for(let i = 0; i < groups[0].layers.length; i++)
      if(('selected' in groups[0].layers[i]) && parseInt(groups[0].layers[i].selected) > 0 && uriParms.vw === -1) uriParms.vw = i;
   if((el = document.getElementById(groups[0].layers[uriParms.vw].id)) !== null) el.checked = true;

   map = L.map('map', opts).setView([uriParms['lat'], uriParms['lon']] ,uriParms['zoom']);

   L.control.scale().addTo(map);
   L.control.zoom({position: 'topright'}).addTo(map);

   var latlon = document.getElementById('latlon');
   var fixed = document.getElementById('fixed');
   var bounds = document.getElementById('bounds');

   bounds.innerHTML = getBounds();

   for(let i = 0; i < trail.length; i++) {
      trail[i]._layer = new FGB(map, trail[i]); 
      trail[i]._layer.setActive(true);
   }

   map.on('mousemove', (e) => {
      if(!isMobile) latlon.innerHTML = e.latlng.lat.toFixed(6) + ' ' + e.latlng.lng.toFixed(6);
   });

   map.on("moveend", function(e) {
      bounds.innerHTML = getBounds();
      if(isMobile) {
         let ctr = map.getCenter();
         latlon.innerHTML = ctr.lng.toFixed(6) + ' ' + ctr.lat.toFixed(6);
      }
   });

   showLayers(uriParms);
   layerHandler(0, uriParms.vw);
}

function getBounds() {
   let b = map.getBounds();

   return  b.getWest().toFixed(3) + ' ' + b.getSouth().toFixed(3) + ' ' + b.getEast().toFixed(3) + ' ' + b.getNorth().toFixed(3);
}

function loadLayerGroups(div = '') {
   var ob = null
   if((ob = document.getElementById(div)) === null) return;
   var str = '<span style="display: block; position: absolute; top: 10px; right: 15px; font-weight: bold; font-size: 1.5em;"><a href="#">X</a></span>';
   str += '<div style="display: grid; grid-template-columns: auto auto; grid-column-gap: 10px;">';

   for(let i = 0; i < groups.length; i++) {
      str += '<div style="grid-column: span 2; padding-top: 10px;"><strong>' + groups[i].name + ':</strong></div>';
      for(let j = 0; j < groups[i].layers.length; j++) {
         if(('visible' in groups[i].layers[j]) && !groups[i].layers[j].visible) continue;
         let checked = ('selected' in groups[i].layers[j] && groups[i].layers[j].selected === 1) ? "checked" : "";
         let event = 'onclick="layerHandler(' + i + ", " + j + ')"';
         str += '<div><input type="' + groups[i].opt + '" id="' + groups[i].layers[j].id 
                      + '" name="' + groups[i].id + '" value="' + groups[i].layers[j].name + '" ' + checked + ' ' + event + '>'
         str += '<label for="' + groups[i].layers[j].id + '"><span style="color: ' + groups[i].layers[j].color + ';">' + groups[i].layers[j].name + '</span></label></div>'
      }
   }
   str += '</div>';
   ob.innerHTML = str;
}

function layerHandler(gidx = -1, lidx = -1) {
   if(gidx < 0 || lidx < 0 || map === null) return;

   for(let i = 0; i < groups[gidx].layers.length; i++) {
      for(let j = 0; j < groups[gidx].layers[i].layers.length; j++) {
         if(document.getElementById(groups[gidx].layers[i].id) === null) continue;
         if(!('_layer' in groups[gidx].layers[i].layers[j])) groups[gidx].layers[i].layers[j]._layer = null;
         var checked = document.getElementById(groups[gidx].layers[i].id).checked;

         if(gidx > 0) uriParms.bmlayers[groups[gidx].layers[i].id] = checked;
         if(gidx === 0 && checked) uriParms.vw = i;
         if(groups[gidx].layers[i].layers[j].url.length < 1) continue;

         updateLegend(checked, groups[gidx].layers[i]);

         if(!checked && groups[gidx].layers[i].layers[j]._layer !== null) {
            if(groups[gidx].layers[i].layers[j].type === 'WMTS' || groups[gidx].layers[i].layers[j].type === 'WMS')
               map.removeLayer(groups[gidx].layers[i].layers[j]._layer) 
            else
               if(groups[gidx].layers[i].layers[j]._layer !== null && ('setActive' in groups[gidx].layers[i].layers[j]._layer)) 
                  groups[gidx].layers[i].layers[j]._layer.setActive(checked);
         }

         if(gidx === 0 && checked && ('maxZoom' in groups[gidx].layers[i].layers[j]) && i === lidx) {
            map.options.minZoom = groups[gidx].layers[lidx].layers[j].minZoom;
            map.options.maxZoom = groups[gidx].layers[lidx].layers[j].maxZoom;
            if(map.getZoom() > groups[gidx].layers[lidx].layers[j].maxZoom) map.setZoom(groups[gidx].layers[lidx].layers[j].maxZoom);
         }
   
         if(groups[gidx].opt === 'radio' && groups[gidx].layers[lidx].layers[j].url.length) {
            if(checked && groups[gidx].layers[i].layers[j].type === 'COG') {
               if(groups[gidx].layers[lidx].layers[j]._layer !== null) groups[gidx].layers[lidx].layers[j]._layer.setActive(checked);
               else groups[gidx].layers[lidx].layers[j]._layer = new COG(map, groups[gidx].layers[lidx].layers[j]);
            } else if(checked && (groups[gidx].layers[i].layers[j].type === 'WMTS' || groups[gidx].layers[i].layers[j].type === 'WMS')) {
               groups[gidx].layers[lidx].layers[j]._layer = groups[gidx].layers[i].layers[j].type === 'WMTS'
                  ? L.tileLayer(groups[gidx].layers[lidx].layers[j].url, groups[gidx].layers[lidx].layers[j])
                  : L.tileLayer.wms(groups[gidx].layers[lidx].layers[j].url, groups[gidx].layers[lidx].layers[j]);
               map.addLayer(groups[gidx].layers[lidx].layers[j]._layer);
            } else if(checked && groups[gidx].layers[i].layers[j].type === 'FGB') {
               if(groups[gidx].layers[i].layers[j]._layer === null) groups[gidx].layers[i].layers[j]._layer = new FGB(map, groups[gidx].layers[i].layers[j]);
               else groups[gidx].layers[i].layers[j]._layer.addLayer();
               groups[gidx].layers[i].layers[j]._layer.setActive(checked);
            }
         } else if(groups[gidx].opt === 'checkbox' && groups[gidx].layers[i].layers[j].url.length) {
            if(checked && groups[gidx].layers[i].layers[j].type === 'FGB' && i == lidx) {
               if(groups[gidx].layers[i].layers[j]._layer === null) groups[gidx].layers[i].layers[j]._layer = new FGB(map, groups[gidx].layers[i].layers[j]);
               else groups[gidx].layers[i].layers[j]._layer.addLayer();
               groups[gidx].layers[i].layers[j]._layer.setActive(checked);
            } else if(checked && groups[gidx].layers[i].layers[j].type === 'COG' && i == lidx) {
               if(groups[gidx].layers[i].layers[j]._layer === null) groups[gidx].layers[i].layers[j]._layer = new COG(map, groups[gidx].layers[i].layers[j]);
               else groups[gidx].layers[i].layers[j]._layer.setActive(checked);
            } else if(checked && (groups[gidx].layers[i].layers[j].type === 'WMTS' || groups[gidx].layers[i].layers[j].type === 'WMS') && i == lidx) {
               groups[gidx].layers[i].layers[j]._layer = groups[gidx].layers[i].layers[j].type === 'WMTS'
                  ? L.tileLayer(groups[gidx].layers[i].layers[j].url, groups[gidx].layers[i].layers[j])
                  : L.tileLayer.wms(groups[gidx].layers[i].layers[j].url, groups[gidx].layers[i].layers[j]);
               map.addLayer(groups[gidx].layers[i].layers[j]._layer);
            }
         }
      }
   }
   console.log('layerHandler: ', groups[gidx].layers[lidx].name, groups[gidx].id);
}

function updateLegend(checked = false, layer = null) {
   if(layer === null || !('legend' in layer)) {
       return;
   } else if(('_legendDiv' in layer) && layer._legendDiv !== null) {
      layer._legendDiv.style.display = checked ? 'block' : 'none';
      return;
   } else if(!checked) {
      return;
   }

   layer._legendDiv = document.createElement("div");
   layer._legendDiv.id = layer.legend.id;
   if(('legendClass' in layer)) layer._legendDiv.className = layer.legendClass;
   if(('style' in layer.legend)) layer._legendDiv.style = layer.legend.style;
   if(!('legendClass' in layer) && !('style' in layer.legend)) layer._legendDiv.style = 'height: 300px; background-color: white; border: 1px solid black; padding: 5px;';
   var m = document.getElementById('map');
   m.appendChild(layer._legendDiv);
   
   layer._legend = new JSLegend(layer.legend);
   layer._legend.showLegend();
   m.style.display = "block";

}

function parseUri(parms = {}) {
   var query = window.location.search.substring(1);
   var vars = query.split('&');
   var i, pair, key, value;
   for (i = 0; i < vars.length; i++) {
      pair = vars[i].split('=');
      key = (decodeURIComponent(pair[0]) + '').replace(/[^0-9a-z\.\-_]/gi, '');
      value = (decodeURIComponent(pair[1]) + '').replace(/[^0-9a-z\.\-\_\/\:\,]/gi, '');
      parms[key] = value.match(/[a-z]/i) === null ? Number(value) : value;
   }
   return parms;
}

function showLayers(parms = {}) {
   if(!('layers' in parms)) return;
   var layers = (decodeURIComponent(parms.layers) + "").split(',');
   var el = null;
   for (var i = 0; i < layers.length; i++) {
      if((el = document.getElementById(layers[i])) !== null) {
         el.checked = true;
         el.onclick();
      }
   }
}

