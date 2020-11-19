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
  expect(compass.summary.bearing).toBeGreaterThan(6-1);
  expect(compass.summary.bearing).toBeLessThan(6+1);
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
  expect(compass.summary.bearing).toBeGreaterThan(7-1);
  expect(compass.summary.bearing).toBeLessThan(7+1);
  // carrying direction was west
  expect(compass.summary.orientation).toBeGreaterThan(1-1);
  expect(compass.summary.orientation).toBeLessThan(1+1);
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

test('going north with the phone in east orientation', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201119-001.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.generateSummary();
  // walking direction was 4 degress north
  expect(compass.summary.bearing).toBeGreaterThan(4-3);
  expect(compass.summary.bearing).toBeLessThan(4+3);
  // carrying direction was west
  expect(compass.summary.orientation).toBeGreaterThan(29-1);
  expect(compass.summary.orientation).toBeLessThan(29+1);
});

test('going north with the phone in north orientation', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201119-002.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.generateSummary();
  // walking direction was 4 degress north
  expect(compass.summary.bearing).toBeGreaterThan(7-1);
  expect(compass.summary.bearing).toBeLessThan(7+1);
  // carrying direction was north
  expect(compass.summary.orientation).toBeGreaterThan(87-1);
  expect(compass.summary.orientation).toBeLessThan(87+1);
});

test('going north with the phone in north orientation on the last two samples', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201119-002.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.averages = compass.averages.slice((-1)*2);
  compass.generateSummary();
  // walking direction was 4 degress north
  expect(compass.summary.bearing).toBeGreaterThan(2-1);
  expect(compass.summary.bearing).toBeLessThan(2+1);
  // carrying direction was north
  expect(compass.summary.orientation).toBeGreaterThan(86-1);
  expect(compass.summary.orientation).toBeLessThan(86+1);
  expect(compass.summary.quality).toBeGreaterThan(0.99);
});

test('going east with the phone in east orientation', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201119-003.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.generateSummary();
  // walking direction was east
  expect(compass.summary.bearing).toBeGreaterThan(93-1);
  expect(compass.summary.bearing).toBeLessThan(93+1);
  // carrying direction was east
  expect(compass.summary.orientation).toBeGreaterThan(95-1);
  expect(compass.summary.orientation).toBeLessThan(95+1);
});

test('going east with the phone in east orientation on the last three samples', () => {
  const compass = new Compass();
  const fixture = require('./fixtures/trace-fp3-20201119-003.json');
  compass.buffer = fixture;
  compass.generateAverages();
  compass.averages = compass.averages.slice((-1)*3);
  compass.generateSummary();
  // walking direction was east
  expect(compass.summary.bearing).toBeGreaterThan(96-1);
  expect(compass.summary.bearing).toBeLessThan(96+1);
  // carrying direction was east
  expect(compass.summary.orientation).toBeGreaterThan(91-1);
  expect(compass.summary.orientation).toBeLessThan(91+1);
  expect(compass.summary.quality).toBeGreaterThan(0.99);
});
