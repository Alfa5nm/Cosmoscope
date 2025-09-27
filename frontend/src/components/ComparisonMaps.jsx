import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import useStore from '../state/useStore.js';
import { templateToUrl } from '../utils/dataset.js';

function buildMap(target, view) {
  return new Map({
    target,
    view,
    controls: defaultControls({ attribution: false, zoom: false }),
    layers: []
  });
}

function ensureLayer(map, dataset, date, zIndex = 0) {
  if (!map) return;
  const url = templateToUrl(dataset.template, date);
  let layer = map.getLayers().item(zIndex);
  if (!layer) {
    layer = new TileLayer({
      source: new XYZ({ url, crossOrigin: 'anonymous' }),
      zIndex
    });
    map.addLayer(layer);
  } else {
    layer.getSource().setUrl(url);
  }
}

export default function ComparisonMaps() {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftMapRef = useRef(null);
  const rightMapRef = useRef(null);
  const sharedViewRef = useRef(null);

  const { comparison, datasets, selectedDate } = useStore((state) => ({
    comparison: state.comparison,
    datasets: state.datasets,
    selectedDate: state.selectedDate
  }));

  useEffect(() => {
    if (!leftRef.current || !rightRef.current) return;
    if (!sharedViewRef.current) {
      sharedViewRef.current = new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
        minZoom: 1,
        maxZoom: 12
      });
    }
    if (!leftMapRef.current) {
      leftMapRef.current = buildMap(leftRef.current, sharedViewRef.current);
    }
    if (!rightMapRef.current) {
      rightMapRef.current = buildMap(rightRef.current, sharedViewRef.current);
    }

    return () => {
      if (leftMapRef.current) {
        leftMapRef.current.setTarget(null);
      }
      if (rightMapRef.current) {
        rightMapRef.current.setTarget(null);
      }
    };
  }, []);

  useEffect(() => {
    const leftDataset = datasets.find((item) => item.id === comparison.leftDatasetId);
    const rightDataset = datasets.find((item) => item.id === comparison.rightDatasetId);

    if (leftMapRef.current && leftDataset) {
      ensureLayer(leftMapRef.current, leftDataset, selectedDate, 0);
    }

    if (rightMapRef.current && rightDataset) {
      const baseDate = selectedDate ? new Date(selectedDate) : new Date();
      if (Number.isNaN(baseDate.getTime())) {
        baseDate.setTime(Date.now());
      }
      baseDate.setDate(baseDate.getDate() + comparison.dateOffsetDays);
      const iso = baseDate.toISOString().slice(0, 10);
      ensureLayer(rightMapRef.current, rightDataset, iso, 0);
    }
  }, [comparison, datasets, selectedDate]);

  return (
    <div className="comparison-maps">
      <div className="comparison-map">
        <div ref={leftRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div className="comparison-map">
        <div ref={rightRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
}
