// MandiWay hero globe: India in front, trade arcs between mandi cities.
import { buildDottedGlobe } from '/assets/globe-engine.js';

const CITIES = [
  [19.07, 72.88], // 0 Mumbai
  [28.61, 77.21], // 1 Delhi
  [22.57, 88.36], // 2 Kolkata
  [13.08, 80.27], // 3 Chennai
  [12.97, 77.59], // 4 Bengaluru
  [17.39, 78.49], // 5 Hyderabad
  [23.02, 72.57], // 6 Ahmedabad
  [26.91, 75.79], // 7 Jaipur
  [15.36, 75.12], // 8 Hubballi
  [30.73, 76.78], // 9 Chandigarh
  [21.15, 79.09], // 10 Nagpur
  [25.32, 82.97], // 11 Varanasi
  [21.17, 72.83], // 12 Surat
  [18.52, 73.86], // 13 Pune
  [26.14, 91.74], // 14 Guwahati
  [9.93, 76.27],  // 15 Kochi
  [22.72, 75.86], // 16 Indore
  [26.85, 80.95]  // 17 Lucknow
];
const ROUTES = [[12, 13], [8, 4], [1, 2], [16, 0], [9, 1], [3, 15], [6, 7], [10, 5], [14, 2], [17, 11], [4, 3], [0, 1], [5, 13], [7, 16]];

export function mountGlobe(el) {
  return buildDottedGlobe(el, {
    fill: 'dots', scale: 1, oceanColor: 'transparent', landColor: '#1d4fd0',
    dotSpacing: 0.72, dotSize: 0.34, dotColor: '#7ea2ff', dotOpacity: 0.9, landOnly: true,
    showOutline: false, outlineColor: '#ffffff', outlineWidth: 0.16,
    showGraticule: false, graticuleColor: '#d4d4d4', graticuleStep: 15, graticuleWidth: 0.25, graticuleOpacity: 1,
    spin: 0, direction: -1, stopOnHover: false, dragSensitivity: 4, friction: 3,
    tilt: 22, longitude: -178, sway: 14,
    markers: CITIES.map((c) => c.join(',')).join('\n'), markerColor: '#ffb27a', markerSize: 0.55,
    cities: CITIES, routes: ROUTES
  });
}
