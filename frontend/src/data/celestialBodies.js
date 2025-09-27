export const celestialBodies = [
  {
    id: 'sun',
    name: 'Sun',
    color: '#f7b733',
    orbitRadius: 0,
    size: 4.5,
    orbitSpeed: 0,
    rotationSpeed: 0.0005,
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
    orbitRadius: 9,
    size: 0.4,
    orbitSpeed: 0.012,
    rotationSpeed: 0.001,
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
    orbitRadius: 13,
    size: 0.95,
    orbitSpeed: 0.0095,
    rotationSpeed: 0.0008,
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
    orbitRadius: 18,
    size: 1,
    orbitSpeed: 0.008,
    rotationSpeed: 0.02,
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
    orbitRadius: 22,
    size: 0.27,
    orbitSpeed: 0.0085,
    rotationSpeed: 0.01,
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
    orbitRadius: 26,
    size: 0.53,
    orbitSpeed: 0.0065,
    rotationSpeed: 0.015,
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
    orbitRadius: 33,
    size: 2.5,
    orbitSpeed: 0.004,
    rotationSpeed: 0.03,
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
    orbitRadius: 39,
    size: 2.2,
    orbitSpeed: 0.003,
    rotationSpeed: 0.028,
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
    orbitRadius: 45,
    size: 1.9,
    orbitSpeed: 0.0024,
    rotationSpeed: 0.02,
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
    orbitRadius: 52,
    size: 1.8,
    orbitSpeed: 0.002,
    rotationSpeed: 0.019,
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

export function getBodyById(bodyId) {
  return celestialBodies.find((body) => body.id === bodyId);
}
