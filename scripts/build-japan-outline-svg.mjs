/**
 * GeoJSON (lon/lat) → 単色の日本輪郭 SVG（等角円筒図法・示意用）
 * データ: https://github.com/johan/world.geo.json (JPN.geo.json)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "assets", "japan-outline.svg");

const gj = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "JPN",
      properties: { name: "Japan" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [134.638428, 34.149234],
              [134.766379, 33.806335],
              [134.203416, 33.201178],
              [133.79295, 33.521985],
              [133.280268, 33.28957],
              [133.014858, 32.704567],
              [132.363115, 32.989382],
              [132.371176, 33.463642],
              [132.924373, 34.060299],
              [133.492968, 33.944621],
              [133.904106, 34.364931],
              [134.638428, 34.149234],
            ],
          ],
          [
            [
              [140.976388, 37.142074],
              [140.59977, 36.343983],
              [140.774074, 35.842877],
              [140.253279, 35.138114],
              [138.975528, 34.6676],
              [137.217599, 34.606286],
              [135.792983, 33.464805],
              [135.120983, 33.849071],
              [135.079435, 34.596545],
              [133.340316, 34.375938],
              [132.156771, 33.904933],
              [130.986145, 33.885761],
              [132.000036, 33.149992],
              [131.33279, 31.450355],
              [130.686318, 31.029579],
              [130.20242, 31.418238],
              [130.447676, 32.319475],
              [129.814692, 32.61031],
              [129.408463, 33.296056],
              [130.353935, 33.604151],
              [130.878451, 34.232743],
              [131.884229, 34.749714],
              [132.617673, 35.433393],
              [134.608301, 35.731618],
              [135.677538, 35.527134],
              [136.723831, 37.304984],
              [137.390612, 36.827391],
              [138.857602, 37.827485],
              [139.426405, 38.215962],
              [140.05479, 39.438807],
              [139.883379, 40.563312],
              [140.305783, 41.195005],
              [141.368973, 41.37856],
              [141.914263, 39.991616],
              [141.884601, 39.180865],
              [140.959489, 38.174001],
              [140.976388, 37.142074],
            ],
          ],
          [
            [
              [143.910162, 44.1741],
              [144.613427, 43.960883],
              [145.320825, 44.384733],
              [145.543137, 43.262088],
              [144.059662, 42.988358],
              [143.18385, 41.995215],
              [141.611491, 42.678791],
              [141.067286, 41.584594],
              [139.955106, 41.569556],
              [139.817544, 42.563759],
              [140.312087, 43.333273],
              [141.380549, 43.388825],
              [141.671952, 44.772125],
              [141.967645, 45.551483],
              [143.14287, 44.510358],
              [143.910162, 44.1741],
            ],
          ],
        ],
      },
    },
  ],
};

const pad = 0.35;
let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

function scanRing(ring) {
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
}

for (const f of gj.features) {
  const g = f.geometry;
  if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates) {
      for (const ring of poly) scanRing(ring);
    }
  }
}

const lonR = maxLon - minLon;
const latR = maxLat - minLat;
minLon -= lonR * pad;
maxLon += lonR * pad;
minLat -= latR * pad;
maxLat += latR * pad;

const W = 1000;
const H = Math.round((W * (maxLat - minLat)) / (maxLon - minLon));

function pj(lon, lat) {
  const x = ((lon - minLon) / (maxLon - minLon)) * W;
  const y = ((maxLat - lat) / (maxLat - minLat)) * H;
  return [+x.toFixed(2), +y.toFixed(2)];
}

function ringToD(ring) {
  const pts = ring.map(([lon, lat]) => pj(lon, lat));
  return (
    pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
      .join(" ") + " Z"
  );
}

const paths = [];
for (const f of gj.features) {
  const g = f.geometry;
  if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates) {
      for (const ring of poly) {
        paths.push(`    <path class="japan-land" d="${ringToD(ring)}" />`);
      }
    }
  }
}

const nagoyaLon = 136.906;
const nagoyaLat = 35.181;
const [nx, ny] = pj(nagoyaLon, nagoyaLat);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
  <!-- 出典: johan/world.geo.json JPN（等角円筒・パディング付きで正規化） -->
  <g class="japan-outline" fill="currentColor">
${paths.join("\n")}
  </g>
  <!-- 名古屋（136.906, 35.181）— ヒーローでオーバーレイ参照用 -->
  <circle class="japan-hub-ref" cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="0" fill="none" />
</svg>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, svg, "utf8");
console.log("Wrote", outPath, `${W}x${H}, Nagoya ~ (${nx.toFixed(1)}, ${ny.toFixed(1)})`);
