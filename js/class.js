
class FGB {
   constructor(map = null, vopts = {}) {
      this.opts = Object.assign({
         url: null
         ,id: null
         ,minZoom: 1
         ,maxZoom: 20
         ,zoomDiv: 500
         ,style: { color: '#000000', weight: 3 }
         ,featureFn: null
         ,template: null
         ,loadingId: null
         ,pad: 0
         ,roundPlaces: 1
         ,update: 0
         ,active: false
         ,minFetch: 2000
      }, vopts);

      this.map = map;
      this.layer = null;
      this.opts.curZoom = this.map.getZoom();
      this.globalBBox = { minX: -180, maxX: 180, minY: -90, maxY: 90 };
      this.headers = null;

      this.update = _.throttle(this.update, 1000);

      this.map.on('moveend', (e) => this.moveEnd(e));
   }

   setActive(v = false) { 
      this.opts.active = v; 
      if(!v) this.removeLayer();
      if(v) this.update();
   }

   moveEnd(e) {
      this.opts.curZoom = this.map.getZoom();

      if(!this.opts.active) return;
      if(this.opts.update > 0) this.update();
   }
   
   layerLoaded() {
      return this.layer !== null ? 1 : 0;
   }

   addLayer() {
      if(this.layer !== null) this.map.addLayer(this.layer);
   }

   removeLayer() {
      if(this.layer !== null && this.map.hasLayer(this.layer)) this.map.removeLayer(this.layer);
   }

   async update() {
      if(this.opts.url === null) return;

      this.opts.zoomDiv = this.markerSpacing(this.map.getZoom());
      if((this.opts.curZoom < this.opts.minZoom || this.opts.curZoom > this.opts.maxZoom) && this.layer !== null) {
         this.map.removeLayer(this.layer);
      } else if(this.opts.curZoom >= this.opts.minZoom && this.opts.curZoom <= this.opts.maxZoom) {
         if(this.layer === null || this.opts.update === 2) this.loadFGB();
         this.map.addLayer(this.layer);
      } else {
         if(this.layer !== null) this.map.addLayer(this.layer);
      }
   }

   toggleDiv(how = null) {
      var o = null;
      if((o = document.getElementById(this.opts.loadingId)) === null) return null;
      let chg = how === null && o.style.display === 'block' ? 'none' : 'block';
      o.style.display = how !== null ? how : chg;
   }

   markerSpacing(z = 5) {
      var ret = 500;
      if(z > 12) ret = 1;
      else if(z > 10) ret = 5;
      else if(z > 9) ret = 10;
      else if(z > 8) ret = 25;
      else if(z > 7) ret = 50;
      else if(z > 6) ret = 100;
      else if(z > 5) ret = 250;
      else if(z > 4) ret = 500;
      else if(z > 0) ret = 1000;
      return ret;
   }

   async loadFGB() {
      this.toggleDiv('block');
      var old = this.layer !== null ? this.layer : null;
      var b = this.map.getBounds();
      var bbox = { 
         //minX: b.getWest() - this.opts.pad
         //,maxX: b.getEast() + this.opts.pad
         //,minY: b.getSouth() - this.opts.pad
         //,maxY: b.getNorth() + this.opts.pad
         minX: this.round2Place('floor', b.getWest() - this.opts.pad, this.opts.roundPlaces)
         ,maxX: this.round2Place('ceil', b.getEast() + this.opts.pad, this.opts.roundPlaces)
         ,minY: this.round2Place('floor', b.getSouth() - this.opts.pad, this.opts.roundPlaces)
         ,maxY: this.round2Place('ceil', b.getNorth() + this.opts.pad, this.opts.roundPlaces)
      };

      this.layer = L.layerGroup();
      if(this.headers === null) {
         var resp = await fetch(this.opts.url, {method: 'HEAD'});
         this.headers = resp.headers;
      }

      if(parseInt(this.headers.get("content-length")) > this.opts.minFetch) {
         for await (let feature of flatgeobuf.deserialize(this.opts.url, this.opts.update === 2 ? bbox : this.globalBBox)) {
            if(this.opts.featureFn === null) {
               var f = L.geoJSON(feature, {
                  style: this.opts.style
                  ,onEachFeature: 'onEachFeature' in this.opts ? this.opts.onEachFeature(this, feature) : null
               });
               f.addTo(this.layer);
            } else {
               this.opts.featureFn(this.layer, feature, this.opts); 
            }
         }
         if(old !== null) this.map.removeLayer(old);
      }
      this.toggleDiv('none');
   }

   round2Place(how, val, p) { 
      return how === 'floor' 
		   ? (Math.floor(val * Math.pow(10, p)) * Math.pow(10, p * -1)).toFixed(p)
		   : (Math.ceil(val * Math.pow(10, p)) * Math.pow(10, p * -1)).toFixed(p);
   }
}

class COG {
   constructor(vmap = null, vopts = {}) {
      this.map = vmap;
      this.opts = Object.assign({
         id: null
         ,url: null
         ,colorFn: null
         ,minValue: 0
         ,maxValue: 255
         ,opacity: 1
         ,zIndex: 2000
         ,loadingId: null
         ,mapId: null
      }, vopts);

      this.layer = null;

      this.loadCOG = _.throttle(this.loadCOG, 1000);
      this.loadCOG();
   }

   setActive(v = false) { 
      v ? this.addLayer() : this.removeLayer();
   }

   layerLoaded() {
      return this.layer !== null ? 1 : 0;
   }

   addLayer() {
      if(this.layer !== null) {
         this.map.addLayer(this.layer);
         this.toggleDiv('none');
      }
   }

   removeLayer() {
      if(this.layer !== null && this.map.hasLayer(this.layer)) {
         this.map.removeLayer(this.layer);
      }
   }

   toggleDiv(how = null) {
      var o = null;
      if((o = document.getElementById(this.opts.loadingId)) === null) return null;
      var chg = how === null && o.style.display === 'block' ? 'none' : 'block';
      o.style.display = how !== null ? how : chg;
   }

   async loadCOG() {
      if(this.opts.url == null || this.map == null) return null;

      this.toggleDiv('block');
      if('colors' in this.opts) {
         this.opts._colors = this.parseColors(this.opts.colors);
         this.opts._range = this.opts.maxValue - this.opts.minValue;
         if(this.opts._range < this.opts._colors.length - 1 && !('minDataValue' in this.opts))
            console.log('loadCOG: Too many colors for range (maxValue - minValue): ',this.opts._range, this.opts._colors.length - 1);
         this.opts._div = this.opts._range / (this.opts._colors.length - 1);
         if(this.opts._div < 1 && !('minDataValue' in this.opts)) console.log('loadCOG: div is zero');
      }

      parseGeoraster(this.opts.url).then(georaster => {
         if(!('noDataValue' in this.opts)) this.opts.noDataValue = georaster.noDataValue;
         var gopts = {
            georaster: georaster
            ,resampleMethod: 'nearest'
            ,resolution: 256
            ,pixelValuesToColorFn: values => this.opts.fn(values, this.opts, georaster.palette)
         };
         Object.assign(gopts, this.opts);
   
         this.layer = new GeoRasterLayer(gopts);
         this.addLayer();
      }).catch(e => {
         this.toggleDiv('none');
         console.log('e: ', e);
      });
   }
   
   parseColors(colors = []) {
      var res = [];
      for(var i = 0; i < colors.length; i++) {
         res[i] = [];
         for(var j = 0; j < 6; j+=2) {
            res[i].push(parseInt(colors[i].replace('#','').substr(j, 2), 16));
         }
      }
      return res;
   }
}
   
class Util {
   constructor() {
   }

   round2Place(how, val, p) { 
      return how === 'floor' 
		   ? (Math.floor(val * Math.pow(10, p)) * Math.pow(10, p * -1)).toFixed(p)
		   : (Math.ceil(val * Math.pow(10, p)) * Math.pow(10, p * -1)).toFixed(p);
   }

   toggleDiv(id = null, how = null) {
      var o = null;
      if((o = document.getElementById(id)) === null) return null;
      let chg = how === null && o.style.display === 'block' ? 'none' : 'block';
      o.style.display = how !== null ? how : chg;
   }

   isChecked(id = null) {
      var res = -1;
      return (res = document.getElementById(id)) === null ? false : res;
   }

   // raster with lookup table, ie, nlcd
   rasterPalette(values = null, opts = {minValue: 0, maxValue: 1}, p = null) {
      return p !== null && values[0] >= opts.minValue && values[0] <= opts.maxValue
         ? 'rgba(' + p[values[0]][0] + ',' + p[values[0]][1] + ',' + p[values[0]][2] + ',' + (p[values[0]][3] / 255) + ')'
         : null;
   }
   
   // gradient for pixel values of type byte
   byteRGBPalette(values = null, opts = {minValue: 0, maxValue: 1, opacity: 1}, p = null) {
      var v = 'valueScaleFn' in opts ? opts.valueScaleFn(values[0]) : values[0];
      return values[0] == opts.noDataValue || v < opts.minValue || v > opts.maxValue
         ? null
         : 'rgb('
            + parseInt(opts.r * (v / opts.maxValue))
            + ',' + parseInt(opts.g * (v / opts.maxValue))
            + ',' + parseInt(opts.b * (v / opts.maxValue))
            + ')';
   }
   
   // non-gradient for pixel values of type byte
   rgbPalette(values = null, opts = {minValue: 0, maxValue: 1, opacity: 1}, p = null) {
      return values[0][0] == opts.noDataValue
         ? null
         : 'rgb('
            + 'valueScaleFn' in opts ? opts.valueScaleFn(values[0][0]) : values[0][0]
            + ',' + 'valueScaleFn' in opts ? opts.valueScaleFn(values[0][1]) : values[0][1]
            + ',' + 'valueScaleFn' in opts ? opts.valueScaleFn(values[0][2]) : values[0][2]
            + ')';
   }
   
   // gradient, min max mapped to each color, ie, max-min = number of hex colors
   gradientPalette(values = null, opts = {minValue: 0, maxValue: 1, opacity: 1}, p = null) {
      var v = 'valueScaleFn' in opts ? opts.valueScaleFn(values[0]) : values[0];
      if(values[0] == opts.noDataValue || v < opts.minValue || v > opts.maxValue) return null;
      var idx = Math.floor(v / opts._div) - 1;
      if(idx >= opts._colors.length - 1) idx--;
      if(idx < 0) return null;
      var pct = v / opts._range;
      return 'rgba('
            + parseInt(opts._colors[idx][0] + parseInt((opts._colors[idx + 1][0] - opts._colors[idx][0]) * pct))
            + ',' + parseInt(opts._colors[idx][1] + parseInt((opts._colors[idx + 1][1] - opts._colors[idx][1]) * pct))
            + ',' + parseInt(opts._colors[idx][2] + parseInt((opts._colors[idx + 1][2] - opts._colors[idx][2]) * pct))
            + ')';
   }

   // use a single color for non noData pixels
   singlePalette(values = null, opts = {noDataValue: 0, opacity: 1, color: '#c00000'}, p = null) {
      var v = 'valueScaleFn' in opts ? opts.valueScaleFn(values[0]) : values[0];
      return values[0] === opts.noDataValue || v < opts.minValue || v > opts.maxValue
         ? null
         : opts.color;
   }

   // gradient when values are not evenly spaced, ie, 1,2,4,8... # of values = # of colors
   rangePalette(values = null, opts = {minValue: 0, maxValue: 1, opacity: 1}, p = null) {
      var v = 'valueScaleFn' in opts ? opts.valueScaleFn(values[0]) : values[0];
      if(values[0] === opts.noDataValue || v < opts.minDataValue || v > opts.maxDataValue) {
         return null;
      } else if(v >= opts.minDataValue && v <= opts.minValue) {
         return 'rgba(' + opts._colors[0][0] + ',' + opts._colors[0][1] + ',' + opts._colors[0][2] + ')';
      } else if(v >= opts.maxValue && v <= opts.maxDataValue) {
         var len = opts._colors.length - 1;
         return 'rgba(' + opts._colors[len][0] + ',' + opts._colors[len][1] + ',' + opts._colors[len][2] + ')';
      }

      var pct = 1;
      for(var i = 0; i < opts.values.length - 2; i++) {
         if(v >= opts.values[i] && v < opts.values[i + 1]) {
            pct = (v - opts.values[i]) / (opts.values[i + 1] - opts.values[i]);
            break;
         }
      }

      return opts._colors[i + 1] === undefined 
         ? null
         : 'rgba('
            + parseInt(opts._colors[i][0] + ((opts._colors[i + 1][0] - opts._colors[i][0]) * pct))
            + ',' + parseInt(opts._colors[i][1] + ((opts._colors[i + 1][1] - opts._colors[i][1]) * pct))
            + ',' + parseInt(opts._colors[i][2] + ((opts._colors[i + 1][2] - opts._colors[i][2]) * pct))
            + ')';
   }

   fillTpl(tpl = "", obj = null) {
      var pat = null;
   
      for(var key in obj) {
         pat = new RegExp("{" + key + "}","g");
         tpl = tpl.replace(pat, obj[key]);
      }
      pat = new RegExp("{.*?}","g");
      tpl = tpl.replace(pat, '-');
      return tpl;
   }

   format(fmt = '', ...args) {
      for(var i = 0; i < args.length; i++) {
         var regexp = new RegExp('\\{'+i+'\\}', 'g');
         fmt = fmt.replace(regexp, args[i]);
      }
      return fmt;
   }

   getISOTimestring() {
      var event = new Date();
      event.setMilliseconds(0);
      event.setSeconds(0);
      event.setMinutes(0);
      return event.toISOString();
   }

   discoverMobile() {
      let details = navigator.userAgent;
      let regexp = /android|iphone|kindle|ipad/i;
      return regexp.test(details);
   }
};


class Markers {
   constructor() {
   }
   mileMarkerFn(layer = null, f = null, opts = null) {
      if(f === null || parseInt(f.properties.mile) % opts.zoomDiv) return null;
      var mess = 'Mile: ' + f.properties.mile + '<br>Elev: ' + f.properties.elev;
      L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], {icon: L.divIcon({className: opts.className, html: f.properties.mile})}).bindTooltip(mess).addTo(layer);
   }
   
   trailTempFn(layer = null, f = null, opts = null) {
      if(f === null || parseInt(f.properties.mile) % opts.zoomDiv) return null;
      var mess = f.properties.mile + '&nbsp;<span style="color: #c00;">' + f.properties.max + '</span>/<span style="color: #00c;">' + f.properties.min + '</span>';
      L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], {icon: L.divIcon({className: opts.className, html: mess})}).addTo(layer);
   }
   
   addLabelMarker(layer = null, feature = null, opts = null) {
      if(feature === null || ( ('mile' in feature.properties) && parseInt(feature.properties.mile)) % opts.zoomDiv) return null;
      var pat = null;
      var tpl = opts.template;
      var poptpl = 'popTemplate' in opts ? opts.popTemplate : null;
      for(var key in feature.properties) {
         pat = new RegExp("{" + key + "}","g");
         tpl = tpl.replace(pat, !(feature.properties[key] + '').length ? '-' : feature.properties[key]);
         if(poptpl !== null) poptpl = poptpl.replace(pat, !(feature.properties[key] + '').length ? '-' : feature.properties[key]);
      }
   
      var crd = null;
      if(feature.geometry.coordinates.length === 2) crd = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
      else if('lat' in feature.properties) crd = [feature.properties.lat, feature.properties.lon];
      else if('latitude' in feature.properties) crd = [feature.properties.latitude, feature.properties.longitude];
  
      pat = new RegExp("{.*?}","g");
      tpl = tpl.replace(pat, '-');
      var m = L.marker(crd, {icon: L.divIcon({className: opts.className, html: tpl})})
      if(poptpl !== null) m.bindPopup(poptpl);
      m.addTo(layer);
   }
   
   addMarker(layer = null, feature = null, opts = null) {
      var pat = null;
      var tpl = opts.template;
      for(var key in feature.properties) {
         pat = new RegExp("{" + key + "}","g");
         tpl = tpl.replace(pat, !(feature.properties[key] + '').length ? '-' : feature.properties[key]);
      }
   
      var crd = null;
      if(feature.geometry.coordinates.length === 2) crd = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
      else if('lat' in feature.properties) crd = [feature.properties.lat, feature.properties.lon];
      else if('latitude' in feature.properties) crd = [feature.properties.latitude, feature.properties.longitude];
   
      pat = new RegExp("{.*?}","g");
      tpl = tpl.replace(pat, '-');
      var mycon = 'className' in opts ? L.divIcon({className: opts.className}) : null;
   
      var m = null;
      if(mycon !== null) m = L.marker(crd, {icon: mycon}).bindPopup(tpl);
      else if('style' in opts) m = L.geoJSON(feature, { style: opts.style }).bindPopup(tpl)
   
      if('name' in feature.properties) m.bindTooltip(feature.properties.name);
      m.addTo(layer);
   }
};

class GPS {
   constructor(opts = {}) {
      this.defaultOpts = {
         enableHighAccuracy: true
         ,timeout: 27000
         ,maximumAge: 30000
         ,locatingID: ''
         ,locatingHTML: ''
      };
      this.opts = Object.assign(this.defaultOpts, opts);
      this.last = null;
      this.geo = ("geolocation" in navigator) ? navigator.geolocation : null;
      this.locating = this.opts.locatingID !== null ? document.getElementById(this.opts.locatingID) : null;
      this.busy = 0;
   }

   hasGPS() { 
      return ("geolocation" in navigator); 
   }

   getLocation () {
      if(this.geo === null || this.busy) return;
      this.busy = 1;
      if(this.locating !== null) {
         this.locating.innerHTML = this.opts.locatingHTML;
      }
      this.geo.getCurrentPosition(pos => {
         this.last = pos;
         if(this.opts.callback !== null) this.opts.callback(this);
         this.busy = 0;
      }, err => {
         if(this.locating !== null) this.locating.innerHTML = "Error";
         alert('Error: ' + err.message);
         this.busy = 0;
      },
      this.opts);
   }
}