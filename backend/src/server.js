import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 4000;
const NASA_API_KEY = process.env.NASA_API_KEY;
const EDL_TOKEN = process.env.EDL_TOKEN;

const ANNOTATIONS_PATH = path.join(__dirname, '..', 'data', 'annotations.json');

const DATASETS = [
  {
    id: 'earth_modis_true_color',
    name: 'Earth · MODIS Terra True Color',
    description: 'Daily true-color mosaic from Terra MODIS at 250m resolution.',
    type: 'xyz',
    projection: 'EPSG:3857',
    template:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    layerId: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    maxZoom: 9,
    minZoom: 0,
    category: 'earth',
    defaultTimeDeltaDays: 0,
    timeRangeDays: 14,
    attribution: 'Imagery courtesy NASA/GSFC GIBS'
  },
  {
    id: 'earth_viirs_true_color',
    name: 'Earth · VIIRS SNPP True Color',
    description: 'VIIRS Suomi NPP corrected reflectance true-color imagery with daily updates.',
    type: 'xyz',
    projection: 'EPSG:3857',
    template:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    layerId: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    maxZoom: 9,
    minZoom: 0,
    category: 'earth',
    defaultTimeDeltaDays: 0,
    timeRangeDays: 14,
    attribution: 'Imagery courtesy NASA/GSFC GIBS'
  },
  {
    id: 'earth_viirs_dnb',
    name: 'Earth · VIIRS Day-Night Band',
    description: 'Nighttime lights from VIIRS Day-Night Band with lunar and auroral detail.',
    type: 'xyz',
    projection: 'EPSG:3857',
    template:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_At_Sensor_Radiance/default/{time}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    layerId: 'VIIRS_SNPP_DayNightBand_At_Sensor_Radiance',
    maxZoom: 8,
    minZoom: 0,
    category: 'earth',
    defaultTimeDeltaDays: 1,
    timeRangeDays: 30,
    attribution: 'Imagery courtesy NASA/GSFC GIBS'
  },
  {
    id: 'mars_marci_global',
    name: 'Mars · MARCI Daily Global Mosaic',
    description: 'Mars Reconnaissance Orbiter MARCI global mosaic from ASU MRB portal.',
    type: 'xyz',
    projection: 'EPSG:3857',
    template:
      'https://mars.nasa.gov/mmgis-maps/MarsGlobal/Tiles/MARCI_RGB_Mosaic/{z}/{x}/{y}.png',
    maxZoom: 8,
    minZoom: 0,
    category: 'mars',
    layerId: 'MARCI_RGB_Mosaic',
    attribution: 'Imagery courtesy NASA/JPL-Caltech/ASU'
  },
  {
    id: 'moon_lroc_global',
    name: 'Moon · LROC WAC Global Mosaic',
    description: 'Global lunar mosaic at 100m from Lunar Reconnaissance Orbiter Camera.',
    type: 'xyz',
    projection: 'EPSG:3857',
    template:
      'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd/{z}/{x}/{y}.png',
    maxZoom: 8,
    minZoom: 0,
    category: 'moon',
    layerId: 'LRO_WAC_Mosaic_Global_303ppd',
    attribution: 'Imagery courtesy NASA/GSFC/ASU'
  }
];

async function ensureAnnotationsFile() {
  try {
    await fs.access(ANNOTATIONS_PATH);
  } catch (err) {
    await fs.mkdir(path.dirname(ANNOTATIONS_PATH), { recursive: true });
    await fs.writeFile(ANNOTATIONS_PATH, '[]', 'utf-8');
  }
}

async function readAnnotations() {
  await ensureAnnotationsFile();
  const raw = await fs.readFile(ANNOTATIONS_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeAnnotations(data) {
  await fs.writeFile(ANNOTATIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/datasets', (_req, res) => {
  res.json({ datasets: DATASETS });
});

app.get('/api/gibs/capabilities', async (req, res) => {
  const epsg = req.query.epsg || 'epsg3857';
  const url = `https://gibs.earthdata.nasa.gov/wmts/${epsg}/best/1.0.0/WMTSCapabilities.xml`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Unable to load GIBS capabilities.' });
    }
    const text = await response.text();
    res.type('application/xml').send(text);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GIBS capabilities.', details: error.message });
  }
});

app.get('/api/gibs/available-dates', async (req, res) => {
  const layer = req.query.layer;
  const days = Number.parseInt(req.query.days || '14', 10);
  if (!layer) {
    return res.status(400).json({ error: 'layer query parameter is required.' });
  }

  const today = new Date();
  const results = [];

  const descriptors = Array.from({ length: days }, (_value, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const iso = date.toISOString().slice(0, 10);
    const testUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${iso}/GoogleMapsCompatible_Level6/0/0/0.jpg`;
    return { iso, testUrl };
  });

  const checks = descriptors.map(({ testUrl }) =>
    fetch(testUrl, { method: 'HEAD' })
  );

  const responses = await Promise.allSettled(checks);

  responses.forEach((result, index) => {
    const { iso } = descriptors[index];
    if (result.status === 'fulfilled') {
      if (result.value.ok) {
        results.push(iso);
      } else {
        console.warn('Date availability check failed', `HTTP ${result.value.status}`);
      }
    } else {
      console.warn('Date availability check failed', result.reason?.message || result.reason);
    }
  });

  res.json({ layer, dates: results });
});

app.post('/api/worldview/snapshot', async (req, res) => {
  const { time, bbox, layers, width = 2048, height = 2048, format = 'image/png', crs = 'EPSG:4326' } = req.body || {};

  if (!time || !bbox || !layers) {
    return res.status(400).json({ error: 'time, bbox, and layers are required.' });
  }

  const params = new URLSearchParams({
    REQUEST: 'GetSnapshot',
    TIME: time,
    BBOX: bbox,
    CRS: crs,
    LAYERS: layers,
    FORMAT: format,
    WIDTH: String(width),
    HEIGHT: String(height)
  });

  const url = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Snapshot request failed.' });
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    res.json({
      contentType: response.headers.get('content-type') || 'image/png',
      data: base64
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch snapshot.', details: error.message });
  }
});

app.get('/api/mast/search', async (req, res) => {
  const target = req.query.target;
  const collection = req.query.collection || 'HST';
  if (!target) {
    return res.status(400).json({ error: 'target query parameter is required.' });
  }

  const body = {
    service: 'Mast.Caom.Filtered',
    format: 'json',
    params: {
      columns: 'obsid,obs_title,target_name,filters,instrument_name,obs_collection,t_min,t_max,t_exptime,proposal_pi,dataURL',
      filters: [
        { paramName: 'obs_collection', values: [collection] },
        { paramName: 'target_name', values: [target] }
      ],
      pageSize: 100
    }
  };

  try {
    const response = await fetch('https://mast.stsci.edu/api/v0/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'MAST request failed.' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to query MAST.', details: error.message });
  }
});

app.get('/api/pds/search', async (req, res) => {
  const query = req.query.q;
  const limit = Number.parseInt(req.query.limit || '25', 10);
  if (!query) {
    return res.status(400).json({ error: 'q query parameter is required.' });
  }

  const url = new URL('https://pds.nasa.gov/api/search/1/products');
  url.searchParams.set('q', query);
  url.searchParams.set('start', '0');
  url.searchParams.set('limit', String(limit));

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(response.status).json({ error: 'PDS request failed.' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to query PDS.', details: error.message });
  }
});

app.get('/api/cmr/granules', async (req, res) => {
  if (!EDL_TOKEN) {
    return res.status(400).json({ error: 'EDL_TOKEN is not configured on the server.' });
  }
  const { short_name: shortName, temporal, bounding_box: boundingBox } = req.query;
  const url = new URL('https://cmr.earthdata.nasa.gov/search/granules.json');
  if (shortName) url.searchParams.set('short_name', shortName);
  if (temporal) url.searchParams.set('temporal', temporal);
  if (boundingBox) url.searchParams.set('bounding_box', boundingBox);
  url.searchParams.set('page_size', '200');

  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${EDL_TOKEN}` }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'CMR request failed.' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to query CMR.', details: error.message });
  }
});

app.get('/api/annotations', async (_req, res) => {
  try {
    const annotations = await readAnnotations();
    res.json({ annotations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load annotations.', details: error.message });
  }
});

app.post('/api/annotations', async (req, res) => {
  const annotations = req.body.annotations;
  if (!Array.isArray(annotations)) {
    return res.status(400).json({ error: 'annotations must be an array.' });
  }
  try {
    await writeAnnotations(annotations);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save annotations.', details: error.message });
  }
});

app.get('/api/apod', async (_req, res) => {
  if (!NASA_API_KEY) {
    return res.status(400).json({ error: 'NASA_API_KEY is not configured on the server.' });
  }

  try {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'APOD request failed.' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch APOD.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Zoomverse backend listening on http://localhost:${PORT}`);
});
