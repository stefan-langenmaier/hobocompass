class Compass {

  constructor() {
    this.orientationLatest;
    this.coordinatesLatest;
    this.buffer = [];
    this.averages = [];
    this.summary = {
      quality: null,
      speed: null,
      bearing: null,
      orientation:null
    };
    
    this.handles = [];
    this.currentQuality = 0;

    this.geoLocationOptions = {
      enableHighAccuracy: true,
      timeout: 2000,
      maximumAge: 1000
    };
  }

  start() {
    window.addEventListener("deviceorientation", this.handleOrientation.bind(this), true);
    this.positionId = window.navigator.geolocation.watchPosition(this.updateCoordinates.bind(this), this.noGeoPositionAvailable.bind(this), this.geoLocationOptions);
    this.compassInterval = setInterval(this.compassInterval.bind(this), 2000);
  }

  record() {
    console.log("Recording");
    window.addEventListener("deviceorientation", this.handleOrientation.bind(this), true);
    this.positionId = window.navigator.geolocation.watchPosition(this.updateCoordinates.bind(this), this.noGeoPositionAvailable.bind(this), this.geoLocationOptions);
  }

  stop() {
    console.log("Stopped recording");
    const debugElement = document.getElementById('debug-container');
    debugElement.innerText = JSON.stringify(this.buffer);
  }

  debug() {
    this.debugInterval = setInterval(this.showDebug.bind(this), 1000);
  }

  handleOrientation(orientation) {
    this.orientationLatest = {
      absolute: orientation.absolute,
      alpha:    orientation.alpha,
      beta:     orientation.beta,
      gamma:    orientation.gamma,
    };
  }

  compassInterval() {
    const QUALITY_LIMIT = 0.95;
    this.generateAverages();
    this.generateSummary();
    // let the latest quality decay so the orientation is refreshed when new good estimates arrive
    this.currentQuality -= 0.001;
    if (this.summary.quality && this.summary.quality > QUALITY_LIMIT && this.summary.quality > this.currentQuality) {
      this.currentQuality = this.summary.quality;
      this.fire();
    }
  }
  
  register(fun) {
    this.handles.push(fun);
  }

  fire() {
    for (let i = 0; i < this.handles.length; i++) {
      this.handles[i](this.summary);
    }
  }

  showDebug() {
    const debugElement = document.getElementById('debug-container');
    
    const alpha = (this.orientationLatest.alpha) ? (this.orientationLatest.alpha) : null;
    debugElement.innerText  = `orientationLatest: ${JSON.stringify(alpha)}\n`;
    debugElement.innerText += `buffer: ${JSON.stringify(this.buffer.length)}\n`;
    debugElement.innerText += `averages: ${JSON.stringify(this.averages.length)}\n`;
    debugElement.innerText += `summary: ${JSON.stringify(this.summary)}\n`;
    if (this.summary.northOffset) {
      debugElement.innerText += `northOffset: ${this.summary.northOffset}\n`;
      debugElement.innerText += `quality: ${this.summary.quality}\n`;
    }
  }

  generateSummary() {
    const MAX_LATEST_WINDOW = 30;
    const MIN_LATEST_WINDOW = 2;
    if (this.averages.length < MIN_LATEST_WINDOW) return {message: 'not enough data'};

    let LATEST_WINDOW = this.averages.length;
    if (LATEST_WINDOW > MAX_LATEST_WINDOW) {
        LATEST_WINDOW = MAX_LATEST_WINDOW;
        this.averages = this.averages.slice((-1)*LATEST_WINDOW);
    }

    const DIFF_DISTANCE = Math.min(5, Math.ceil(LATEST_WINDOW/3));
    let details = [];
    for (let i = 0; i < LATEST_WINDOW-DIFF_DISTANCE; i++) {
      const dist = CompassUtil.geoDistance(this.averages[i].coordinates, this.averages[i+DIFF_DISTANCE].coordinates);
      const speed = dist / (this.averages[i].timestamp - this.averages[i+DIFF_DISTANCE].timestamp);
      const bearing = CompassUtil.bearing(this.averages[i].coordinates, this.averages[i+DIFF_DISTANCE].coordinates);
      
      const orientationReducer = (acc, average) => CompassUtil.angleAcc(acc, average.orientation.alpha);
      const orientation = CompassUtil.convertVector([
            this.averages[i],
            this.averages[i+DIFF_DISTANCE]
            ].reduce(orientationReducer, {x:0, y:0}), 2).angle;

      const northOffset = (bearing + orientation)%360;

      if (this.hasEnoughSpeed(speed)) {
        details.push({
            dist: dist,
            speed: speed,
            bearing: bearing,
            orientation: orientation,
            northOffset: northOffset
        });
      }
    }

    const cntDetails = details.length;

    const bearingReducer = (acc, detail) => CompassUtil.angleAcc(acc, detail.bearing);
    const orientationReducer = (acc, detail) => CompassUtil.angleAcc(acc, detail.orientation);
    const northOffsetReducer = (acc, detail) => CompassUtil.angleAcc(acc, detail.northOffset);
    const northOffset = CompassUtil.convertVector(details.reduce(northOffsetReducer, {x:0, y:0}), cntDetails);

    let summary = {
        dist: details.reduce((sum, x) => (sum + x.dist), 0) / cntDetails,
        speed: details.reduce((sum, x) => (sum + x.speed), 0) / cntDetails,
        bearing: CompassUtil.convertVector(details.reduce(bearingReducer, {x:0, y:0}), cntDetails).angle,
        orientation: CompassUtil.convertVector(details.reduce(orientationReducer, {x:0, y:0}), cntDetails).angle,
        northOffset: northOffset.angle,
        quality: northOffset.quality
    };

    this.summary = summary;
  }

  generateAverages() {
    // sample every second
    const SAMPLING_INTERVALL = 1000;
    const noDataPoints = this.buffer.length;

    let lastTimestamp = null;
    let samples = [];
    for (let i = 0; i < noDataPoints; i++) {
      const currentTimestamp = this.buffer[i].timestamp/SAMPLING_INTERVALL;
      if ((Date.now() - this.buffer[i].timestamp) < SAMPLING_INTERVALL) {
        // we are done for the moment clear buffer up to this
        this.buffer = this.buffer.slice(i);
        
        // analyze remaining samples
        if (samples.length !== 0) {
          this.averages.push(CompassUtil.average(samples));
        }
        
        return;
      }
      if (currentTimestamp != lastTimestamp) {
        if (samples.length !== 0) {
          this.averages.push(CompassUtil.average(samples));
          samples = [];
        }
      }
      lastTimestamp = currentTimestamp;
      samples.push(this.buffer[i]);
    }
  }

  updateCoordinates(position) {
    this.coordinatesLatest = {
      accuracy:         position.coords.accuracy,
      altitude:         position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading:          position.coords.heading,
      latitude:         position.coords.latitude,
      longitude:        position.coords.longitude,
      speed:            position.coords.speed
    };
    if (this.isAccurateEnough(this.coordinatesLatest) &&
        this.isNew(this.coordinatesLatest)) {
      this.buffer.push({
        timestamp:   Date.now(),
        orientation: Object.assign({}, this.orientationLatest), // is this needed
        coordinates: Object.assign({}, this.coordinatesLatest) // is this needed
      });
    }
  }
  
  isAccurateEnough(coordinates) {
    return coordinates.accuracy < 25;
  }
  
  isNew(coordinates) {
    if (this.buffer.length < 1) return true;
    const coordinatesLast = this.buffer[this.buffer.length-1].coordinates;
    // WHELP how to do this properly???
    return JSON.stringify(coordinates) !== JSON.stringify(coordinatesLast);
  }

  hasEnoughSpeed(speed) {
    const MY_WALKING_SPEED=0.0015;
    if (Math.abs(speed) > (MY_WALKING_SPEED/2)) {
      return true;
    }
    return false;
  }

  noGeoPositionAvailable(err) {
    if (err.code === 3) {
      // ignore it: position acquired timeout
      return;
    }
    console.warn(`error: ${err.message}`);
  }

}

// TODO how to avoid name overlap with Util class in other js file?
class CompassUtil {
  static geoDistance(first, second) {
    if ((first.latitude == second.latitude) && (first.longitude == second.longitude)) {
      return 0;
    } else {
      var radlat1 = Math.PI * first.latitude/180;
      var radlat2 = Math.PI * second.latitude/180;
      var theta = first.longitude-second.longitude;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 1000 * 6371;
      return dist;
    }
  }

  //Converts from degrees to radians.
  static toRadians(degrees) {
    return degrees * Math.PI / 180;
  };

  // Converts from radians to degrees.
  static toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  static bearing(start, dest) {
    const startLat = CompassUtil.toRadians(start.latitude);
    const startLng = CompassUtil.toRadians(start.longitude);
    const destLat = CompassUtil.toRadians(dest.latitude);
    const destLng = CompassUtil.toRadians(dest.longitude);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
          Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let brng = Math.atan2(y, x);
    brng = CompassUtil.toDegrees(brng);
    return (brng + 360) % 360;
  }

  static angleAcc(acc, angle) {
    return {
        x: acc.x + Math.cos(CompassUtil.toRadians(angle)),
        y: acc.y + Math.sin(CompassUtil.toRadians(angle))
    };
  }

  static convertVector(angle_sum, normalisation_factor) {
    return {
        angle: (CompassUtil.toDegrees(Math.atan2(angle_sum.y, angle_sum.x))+ 360) % 360,
        quality: Math.sqrt(Math.pow(angle_sum.x, 2) + Math.pow(angle_sum.y, 2)) / normalisation_factor
    };
  }

  static average(samples) {
    const cntSamples = samples.length;
    
    if (cntSamples === 0) throw "Empty samples list!";
    
    const orientationReducer = (acc, sample) => CompassUtil.angleAcc(acc, sample.orientation.alpha);
    const headingReducer = (acc, sample) => CompassUtil.angleAcc(acc, sample.coordinates.heading);

    return {
      timestamp:   samples[0].timestamp,

      orientation: {
        alpha: CompassUtil.convertVector(samples.reduce(orientationReducer, {x:0, y:0}), samples.length).angle
      },
      coordinates: {
        accuracy:         samples.reduce((sum, x) => (sum + x.coordinates.accuracy),         0) / cntSamples,
        altitude:         samples.reduce((sum, x) => (sum + x.coordinates.altitude),         0) / cntSamples,
        altitudeAccuracy: samples.reduce((sum, x) => (sum + x.coordinates.altitudeAccuracy), 0) / cntSamples,
        heading:          CompassUtil.convertVector(samples.reduce(headingReducer, {x:0, y:0}), samples.length).angle,
        latitude:         samples.reduce((sum, x) => (sum + x.coordinates.latitude),         0) / cntSamples,
        longitude:        samples.reduce((sum, x) => (sum + x.coordinates.longitude),        0) / cntSamples,
        speed:            samples.reduce((sum, x) => (sum + x.coordinates.speed),            0) / cntSamples
      }
    };
  }
}
module.exports = Compass;
