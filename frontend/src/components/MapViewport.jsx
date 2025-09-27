import { useEffect, useMemo, useRef } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import GeoJSON from 'ol/format/GeoJSON';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import useStore from '../state/useStore.js';
import { templateToUrl } from '../utils/dataset.js';

const geoJsonFormatter = new GeoJSON();

const annotationStyle = new Style({
  stroke: new Stroke({ color: 'rgba(136, 192, 255, 0.8)', width: 2 }),
  fill: new Fill({ color: 'rgba(136, 192, 255, 0.12)' }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#ffd166' }),
    stroke: new Stroke({ color: '#fca311', width: 2 })
  })
});

const baseView = new View({
  center: fromLonLat([0, 0]),
  zoom: 2,
  minZoom: 1,
  maxZoom: 12
});

function createTileLayer(url, options = {}) {
  const source = new XYZ({ url, crossOrigin: 'anonymous' });
  return new TileLayer({
    source,
    opacity: options.opacity ?? 1,
    zIndex: options.zIndex ?? 0
  });
}

export default function MapViewport() {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const baseLayerRef = useRef(null);
  const overlayLayerRefs = useRef(new Map());
  const annotationsLayerRef = useRef(null);
  const drawRef = useRef(null);
  const modifyRef = useRef(null);
  const snapRef = useRef(null);

  const {
    datasets,
    selectedDatasetId,
    overlays,
    selectedDate,
    annotations,
    annotationMode,
    addAnnotation,
    setAnnotationMode,
    setAnnotations,
    setMapState
  } = useStore((state) => ({
    datasets: state.datasets,
    selectedDatasetId: state.selectedDatasetId,
    overlays: state.overlays,
    selectedDate: state.selectedDate,
    annotations: state.annotations,
    annotationMode: state.annotationMode,
    addAnnotation: state.addAnnotation,
    setAnnotationMode: state.setAnnotationMode,
    setAnnotations: state.setAnnotations,
    setMapState: state.setMapState
  }));

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId),
    [datasets, selectedDatasetId]
  );

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;
    const map = new OlMap({
      target: mapElementRef.current,
      view: baseView,
      layers: [],
      controls: defaultControls({ attribution: true, zoom: true }).extend([
        new ScaleLine({ units: 'metric' })
      ])
    });

    baseView.setCenter(fromLonLat([0, 0]));
    baseView.setZoom(2);

    const annotationsSource = new VectorSource();
    const annotationsLayer = new VectorLayer({
      source: annotationsSource,
      style: annotationStyle,
      zIndex: 50
    });

    map.addLayer(annotationsLayer);

    const modify = new Modify({ source: annotationsSource });
    modify.on('modifyend', () => {
      const features = annotationsSource.getFeatures();
      const collection = features.map((feature) =>
        geoJsonFormatter.writeFeatureObject(feature, {
          featureProjection: 'EPSG:3857'
        })
      );
      setAnnotations(collection);
    });
    const snap = new Snap({ source: annotationsSource });
    map.addInteraction(modify);
    map.addInteraction(snap);

    map.on('moveend', () => {
      const view = map.getView();
      const extent = view.calculateExtent(map.getSize());
      const center = toLonLat(view.getCenter());
      setMapState({ extent, center });
    });

    setTimeout(() => {
      const view = map.getView();
      const extent = view.calculateExtent(map.getSize());
      const center = toLonLat(view.getCenter());
      setMapState({ extent, center });
    }, 0);

    mapRef.current = map;
    annotationsLayerRef.current = annotationsLayer;
    modifyRef.current = modify;
    snapRef.current = snap;
  }, [setAnnotations, setMapState]);

  useEffect(() => {
    if (!mapRef.current || !selectedDataset) return;
    const url = templateToUrl(selectedDataset.template, selectedDate);

    if (!baseLayerRef.current) {
      const layer = createTileLayer(url, { zIndex: 0 });
      baseLayerRef.current = layer;
      mapRef.current.addLayer(layer);
    } else {
      baseLayerRef.current.getSource().setUrl(url);
    }
  }, [selectedDataset, selectedDate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const overlaysSet = new Set(overlays);

    // remove overlays not needed anymore
    for (const [id, layer] of overlayLayerRefs.current.entries()) {
      if (!overlaysSet.has(id)) {
        map.removeLayer(layer);
        overlayLayerRefs.current.delete(id);
      }
    }

    overlays.forEach((datasetId, index) => {
      if (datasetId === selectedDatasetId) return;
      if (overlayLayerRefs.current.has(datasetId)) return;
      const dataset = datasets.find((item) => item.id === datasetId);
      if (!dataset) return;
      const url = templateToUrl(dataset.template, selectedDate);
      const layer = createTileLayer(url, { opacity: 0.6, zIndex: 5 + index });
      overlayLayerRefs.current.set(datasetId, layer);
      map.addLayer(layer);
    });

    // update overlay URLs for date change
    overlays.forEach((datasetId) => {
      const dataset = datasets.find((item) => item.id === datasetId);
      if (!dataset) return;
      const layer = overlayLayerRefs.current.get(datasetId);
      if (!layer) return;
      const url = templateToUrl(dataset.template, selectedDate);
      const source = layer.getSource();
      if (source && source.setUrl) {
        source.setUrl(url);
      }
    });
  }, [datasets, overlays, selectedDatasetId, selectedDate]);

  useEffect(() => {
    if (!annotationsLayerRef.current) return;
    const source = annotationsLayerRef.current.getSource();
    source.clear();

    const features = annotations.map((annotation) => {
      const feature = geoJsonFormatter.readFeature(annotation, {
        featureProjection: 'EPSG:3857'
      });
      feature.setId(annotation.id);
      feature.setProperties({
        ...annotation.properties,
        name: annotation.properties?.name,
        notes: annotation.properties?.notes
      });
      return feature;
    });

    source.addFeatures(features);
  }, [annotations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !annotationsLayerRef.current) return;

    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    if (annotationMode === 'idle') {
      return undefined;
    }

    const geometryType = annotationMode === 'polygon' ? 'Polygon' : 'Point';
    const draw = new Draw({ source: annotationsLayerRef.current.getSource(), type: geometryType });

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const geometry = geoJsonFormatter.writeGeometryObject(feature.getGeometry(), {
        featureProjection: 'EPSG:3857'
      });

      const id = `anno-${Date.now()}`;
      const name = window.prompt('Annotation title', 'New annotation');
      const notes = window.prompt('Notes', '');
      const annotation = {
        type: 'Feature',
        geometry,
        id,
        properties: {
          datasetId: selectedDatasetId,
          createdAt: new Date().toISOString(),
          name: name || 'Untitled feature',
          notes: notes || ''
        }
      };
      addAnnotation(annotation);
      setAnnotationMode('idle');
    });

    map.addInteraction(draw);
    drawRef.current = draw;

    return () => {
      map.removeInteraction(draw);
    };
  }, [annotationMode, selectedDatasetId, addAnnotation, setAnnotationMode]);

  return <div ref={mapElementRef} className="map-container" role="presentation" />;
}
