const Compass = require('./compass.js');

test('fresh compass has empty summary', () => {
  const compass = new Compass();
  expect(compass.summary).toStrictEqual({"bearing": null, "orientation": null, "quality": null, "speed": null});
});

test('going north with the phone in north orientation', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201028-001.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.generateSummary();
  // walking direction was 4 degress north
  expect(compass.summary.bearing).toBeGreaterThan(4-1);
  expect(compass.summary.bearing).toBeLessThan(4+1);
  // carrying direction was about 4 degress north
  expect(compass.summary.orientation).toBeGreaterThan(94-1);
  expect(compass.summary.orientation).toBeLessThan(94+1);
});

test('going north with the phone in west orientation', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201118-001.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.generateSummary();
  // walking direction was 4 degress north
  expect(compass.summary.bearing).toBeGreaterThan(4-1);
  expect(compass.summary.bearing).toBeLessThan(4+1);
  // carrying direction was west
  expect(compass.summary.orientation).toBeGreaterThan(75-1);
  expect(compass.summary.orientation).toBeLessThan(75+1);
});

test('going east with the phone in east orientation', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201118-002.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.generateSummary();
  // walking direction was east
  expect(compass.summary.bearing).toBeGreaterThan(96-1);
  expect(compass.summary.bearing).toBeLessThan(96+1);
  // carrying direction was east
  expect(compass.summary.orientation).toBeGreaterThan(94-1);
  expect(compass.summary.orientation).toBeLessThan(94+1);
});

test('going north with the phone in west orientation', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201119-001.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.generateSummary();
  // walking direction was 4 degress north
  expect(compass.summary.bearing).toBeGreaterThan(4-3);
  expect(compass.summary.bearing).toBeLessThan(4+3);
  // carrying direction was west
  expect(compass.summary.orientation).toBeGreaterThan(28-1);
  expect(compass.summary.orientation).toBeLessThan(28+1);
});