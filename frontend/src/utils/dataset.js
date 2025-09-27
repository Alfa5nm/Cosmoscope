import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';

export function templateToUrl(template, date) {
  if (!template) return null;
  if (!date) return template.replace('{time}', new Date().toISOString().slice(0, 10));
  return template.replace('{time}', date);
}

export function createDatasetLayer(dataset, options = {}) {
  const { date, opacity = 1 } = options;
  const sourceUrl = templateToUrl(dataset.template, date);
  return new TileLayer({
    opacity,
    source: new XYZ({
      url: sourceUrl,
      crossOrigin: 'anonymous'
    }),
    zIndex: options.zIndex ?? 0
  });
}

export default createDatasetLayer;
