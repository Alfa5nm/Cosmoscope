const DISTANCE_LOG_FACTOR = 5;
const DISTANCE_SCALE = 22;
const ORBITAL_DAY_SCALE = 2.1;
const ROTATION_HOUR_SCALE = 13;
const MOON_DISTANCE_SCALE = 0.000009;
const DEG_TO_RAD = Math.PI / 180;

function scaleOrbitDistance({ au, km }) {
  if (typeof au === 'number') {
    if (au === 0) return 0;
    return Math.log10(1 + au * DISTANCE_LOG_FACTOR) * DISTANCE_SCALE;
  }
  if (typeof km === 'number') {
    if (km === 0) return 0;
    return km * MOON_DISTANCE_SCALE;
  }
  return 0;
}

function computeRotationRate(rotationPeriodHours = 0) {
  if (!rotationPeriodHours) {
    return 0;
  }
  const direction = rotationPeriodHours < 0 ? -1 : 1;
  const period = Math.abs(rotationPeriodHours);
  return (direction * 2 * Math.PI) / (period * ROTATION_HOUR_SCALE);
}

function computeOrbitRate(orbitalPeriodDays = 0) {
  if (!orbitalPeriodDays) {
    return 0;
  }
  return (2 * Math.PI) / (orbitalPeriodDays * ORBITAL_DAY_SCALE);
}

function prepareBody(body) {
  const semiMajorAxis = body.semiMajorAxis;
  const eccentricity = body.eccentricity ?? 0;
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
  const axialTilt = body.axialTilt ?? 0;
  const inclination = body.inclination ?? 0;

  return {
    ...body,
    semiMajorAxis,
    semiMinorAxis,
    orbitRate: computeOrbitRate(body.orbitalPeriodDays),
    rotationRate: computeRotationRate(body.rotationPeriodHours),
    axialTilt,
    axialTiltRad: axialTilt * DEG_TO_RAD,
    inclination,
    inclinationRad: inclination * DEG_TO_RAD
  };
}

const rawBodies = [
  {
    id: 'sun',
    name: 'Sun',
    color: '#f7b733',
    size: 4.5,
    semiMajorAxis: 0,
    eccentricity: 0,
    orbitalPeriodDays: 0,
    rotationPeriodHours: 609.12,
    axialTilt: 7.25,
    inclination: 0,
    description:
      'Our local star powers life on Earth and drives space weather across the solar system. Its surface boils with convection cells while solar flares hurl charged particles into space.',
    highlights: [
      'Classified as a G-type main-sequence star.',
      'Approximate diameter: 1.39 million km.',
      '11-year cycle governs sunspots and coronal mass ejections.'
    ],
    datasetCategory: 'sun',
    nasaQuery: 'solar flare'
  },
  {
    id: 'mercury',
    name: 'Mercury',
    color: '#b5b3aa',
    size: 0.4,
    semiMajorAxis: scaleOrbitDistance({ au: 0.387 }),
    eccentricity: 0.2056,
    orbitalPeriodDays: 87.969,
    rotationPeriodHours: 1407.5,
    axialTilt: 0.034,
    inclination: 7.0,
    description:
      'Mercury is a heavily cratered world with extreme temperature swings. NASA\'s MESSENGER mission mapped its surface and studied its magnetic field.',
    highlights: [
      'Smallest planet in the solar system.',
      'Orbital period of 88 Earth days.',
      'Has a tenuous exosphere instead of a substantial atmosphere.'
    ],
    datasetCategory: 'mercury',
    nasaQuery: 'Mercury planet surface'
  },
  {
    id: 'venus',
    name: 'Venus',
    color: '#e6c15a',
    size: 0.95,
    semiMajorAxis: scaleOrbitDistance({ au: 0.723 }),
    eccentricity: 0.0068,
    orbitalPeriodDays: 224.701,
    rotationPeriodHours: -5832.5,
    axialTilt: 177.36,
    inclination: 3.39,
    description:
      'Venus is a greenhouse world enveloped by thick clouds. Radar mapping by Magellan reveals volcanoes, mountains, and tectonic plains beneath the haze.',
    highlights: [
      'Second planet from the Sun with a dense CO₂ atmosphere.',
      'Surface temperatures soar above 460°C.',
      'Rotates slowly in a retrograde direction.'
    ],
    datasetCategory: 'venus',
    nasaQuery: 'Venus radar map'
  },
  {
    id: 'earth',
    name: 'Earth',
    color: '#2f8ae6',
    size: 1,
    semiMajorAxis: scaleOrbitDistance({ au: 1 }),
    eccentricity: 0.0167,
    orbitalPeriodDays: 365.256,
    rotationPeriodHours: 23.934,
    axialTilt: 23.44,
    inclination: 0,
    description:
      'Earth is a water-rich, life-supporting world with dynamic weather, plate tectonics, and a protective magnetic field. NASA operates dozens of missions to monitor its systems.',
    highlights: [
      'Only known planet with liquid water on the surface.',
      'Protected by a magnetic field generated in the core.',
      'Dozens of Earth-observing satellites provide daily imagery.'
    ],
    datasetCategory: 'earth',
    nasaQuery: 'Earth observation'
  },
  {
    id: 'moon',
    name: 'Moon',
    color: '#cfd2d7',
    size: 0.27,
    semiMajorAxis: scaleOrbitDistance({ km: 384400 }),
    eccentricity: 0.0549,
    orbitalPeriodDays: 27.321,
    rotationPeriodHours: 655.7,
    axialTilt: 6.68,
    inclination: 5.145,
    parentId: 'earth',
    description:
      "Earth's Moon preserves a record of early solar-system history. Lunar Reconnaissance Orbiter continues to deliver topographic maps and ultra-high-resolution imagery.",
    highlights: [
      'Diameter of 3,474 km with a synchronous rotation.',
      'Hosts water ice in permanently shadowed craters.',
      'Key target for NASA Artemis exploration missions.'
    ],
    datasetCategory: 'moon',
    nasaQuery: 'LRO Moon map'
  },
  {
    id: 'mars',
    name: 'Mars',
    color: '#d05d3b',
    size: 0.53,
    semiMajorAxis: scaleOrbitDistance({ au: 1.524 }),
    eccentricity: 0.0934,
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.623,
    axialTilt: 25.19,
    inclination: 1.85,
    description:
      'Mars features towering volcanoes, ancient river deltas, and seasons similar to Earth. NASA rovers and orbiters study its past habitability and climate evolution.',
    highlights: [
      'Hosts the tallest volcano in the solar system: Olympus Mons.',
      'Perseverance and Curiosity rovers explore the surface.',
      'Seasonal dust storms can envelop the entire planet.'
    ],
    datasetCategory: 'mars',
    nasaQuery: 'Mars Reconnaissance Orbiter'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    color: '#c58f5d',
    size: 2.5,
    semiMajorAxis: scaleOrbitDistance({ au: 5.203 }),
    eccentricity: 0.0489,
    orbitalPeriodDays: 4332.59,
    rotationPeriodHours: 9.925,
    axialTilt: 3.13,
    inclination: 1.304,
    description:
      'The largest planet is a gas giant with swirling belts and the famous Great Red Spot. NASA\'s Juno mission peers beneath its cloud tops.',
    highlights: [
      'Has at least 79 moons, including volcanic Io and icy Europa.',
      'Immense magnetosphere extends millions of kilometers.',
      'Rapid 10-hour rotation period.'
    ],
    datasetCategory: 'jupiter',
    nasaQuery: 'Juno spacecraft Jupiter'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    color: '#f3d38c',
    size: 2.2,
    semiMajorAxis: scaleOrbitDistance({ au: 9.582 }),
    eccentricity: 0.0565,
    orbitalPeriodDays: 10759.22,
    rotationPeriodHours: 10.656,
    axialTilt: 26.73,
    inclination: 2.485,
    rings: {
      innerRadius: 3.2,
      outerRadius: 4.6,
      colorStops: [
        { offset: 0, color: 'rgba(255, 255, 255, 0.1)' },
        { offset: 0.35, color: 'rgba(243, 211, 140, 0.45)' },
        { offset: 0.65, color: 'rgba(212, 178, 120, 0.55)' },
        { offset: 1, color: 'rgba(255, 255, 255, 0.1)' }
      ]
    },
    description:
      'Saturn is adorned with icy rings and moons like Titan and Enceladus. The Cassini mission revealed active geysers and complex atmospheric patterns.',
    highlights: [
      'Rings are composed primarily of ice particles and dust.',
      'Titan features lakes and seas of liquid hydrocarbons.',
      'Cassini orbited Saturn for 13 years before plunging into the atmosphere.'
    ],
    datasetCategory: 'saturn',
    nasaQuery: 'Cassini Saturn'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    color: '#78d0e3',
    size: 1.9,
    semiMajorAxis: scaleOrbitDistance({ au: 19.189 }),
    eccentricity: 0.0472,
    orbitalPeriodDays: 30685.4,
    rotationPeriodHours: -17.24,
    axialTilt: 97.77,
    inclination: 0.773,
    rings: {
      innerRadius: 2.4,
      outerRadius: 3.1,
      colorStops: [
        { offset: 0, color: 'rgba(180, 220, 255, 0.05)' },
        { offset: 0.5, color: 'rgba(120, 190, 230, 0.25)' },
        { offset: 1, color: 'rgba(180, 220, 255, 0.05)' }
      ]
    },
    description:
      'An ice giant tipped on its side, Uranus has extreme seasons and a faint ring system. Voyager 2 remains the only spacecraft to have visited it.',
    highlights: [
      'Axis tilt of 98 degrees leads to unusual seasons.',
      'Possesses a magnetic field offset from its rotation axis.',
      'At least 27 known moons, named after literary characters.'
    ],
    datasetCategory: 'uranus',
    nasaQuery: 'Uranus Voyager'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    color: '#3f6dd5',
    size: 1.8,
    semiMajorAxis: scaleOrbitDistance({ au: 30.07 }),
    eccentricity: 0.0086,
    orbitalPeriodDays: 60190,
    rotationPeriodHours: 16.11,
    axialTilt: 28.32,
    inclination: 1.77,
    description:
      'Neptune is a windy ice giant with supersonic storms. Voyager 2 revealed its dynamic atmosphere and the moon Triton\'s icy geysers.',
    highlights: [
      'Fastest winds in the solar system, exceeding 1,900 km/h.',
      'Deep blue color comes from methane in the atmosphere.',
      'Orbits the Sun every 165 Earth years.'
    ],
    datasetCategory: 'neptune',
    nasaQuery: 'Neptune Voyager Triton'
  }
];

export const celestialBodies = rawBodies.map((body) => prepareBody(body));

export function getBodyById(bodyId) {
  return celestialBodies.find((body) => body.id === bodyId);
}
