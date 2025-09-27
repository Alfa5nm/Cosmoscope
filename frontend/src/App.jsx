import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import MapViewport from './components/MapViewport.jsx';
import ComparisonMaps from './components/ComparisonMaps.jsx';
import AnnotationPanel from './components/AnnotationPanel.jsx';
import DeepSpaceSearch from './components/DeepSpaceSearch.jsx';
import PlanetarySearch from './components/PlanetarySearch.jsx';
import SnapshotExporter from './components/SnapshotExporter.jsx';
import useStore from './state/useStore.js';

function useDatasets() {
  const { setDatasets, setDatasetStatus } = useStore((state) => ({
    setDatasets: state.setDatasets,
    setDatasetStatus: state.setDatasetStatus
  }));

  useEffect(() => {
    async function loadDatasets() {
      setDatasetStatus('loading');
      try {
        const response = await fetch('/api/datasets');
        if (!response.ok) {
          throw new Error('Failed to load dataset catalog');
        }
        const data = await response.json();
        setDatasets(data.datasets);
      } catch (error) {
        console.error(error);
        setDatasetStatus('error');
      }
    }
    loadDatasets();
  }, [setDatasets, setDatasetStatus]);
}

function useAnnotations() {
  const { setAnnotations } = useStore((state) => ({ setAnnotations: state.setAnnotations }));
  useEffect(() => {
    async function loadAnnotations() {
      try {
        const response = await fetch('/api/annotations');
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.annotations)) {
          setAnnotations(data.annotations);
        }
      } catch (error) {
        console.warn('Failed to load annotations', error);
      }
    }
    loadAnnotations();
  }, [setAnnotations]);
}

export default function App() {
  useDatasets();
  useAnnotations();

  const [availableDates, setAvailableDates] = useState([]);
  const [apod, setApod] = useState(null);
  const [apodError, setApodError] = useState(null);

  const {
    datasets,
    datasetStatus,
    selectedDatasetId,
    selectDataset,
    overlays,
    toggleOverlay,
    selectedDate,
    setSelectedDate,
    comparisonEnabled,
    setComparisonEnabled,
    comparison,
    setComparison,
    annotationMode,
    setAnnotationMode,
    annotations
  } = useStore((state) => ({
    datasets: state.datasets,
    datasetStatus: state.datasetStatus,
    selectedDatasetId: state.selectedDatasetId,
    selectDataset: state.selectDataset,
    overlays: state.overlays,
    toggleOverlay: state.toggleOverlay,
    selectedDate: state.selectedDate,
    setSelectedDate: state.setSelectedDate,
    comparisonEnabled: state.comparisonEnabled,
    setComparisonEnabled: state.setComparisonEnabled,
    comparison: state.comparison,
    setComparison: state.setComparison,
    annotationMode: state.annotationMode,
    setAnnotationMode: state.setAnnotationMode,
    annotations: state.annotations
  }));

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId),
    [datasets, selectedDatasetId]
  );

  useEffect(() => {
    if (selectedDatasetId) {
      setComparison({ leftDatasetId: selectedDatasetId });
    }
  }, [selectedDatasetId, setComparison]);

  useEffect(() => {
    if (!datasets.length) return;
    if (!comparison.rightDatasetId || comparison.rightDatasetId === selectedDatasetId) {
      const fallback = datasets.find((dataset) => dataset.id !== selectedDatasetId)?.id || null;
      setComparison({ rightDatasetId: fallback });
    }
  }, [datasets, comparison.rightDatasetId, selectedDatasetId, setComparison]);

  useEffect(() => {
    async function loadApod() {
      try {
        const response = await fetch('/api/apod');
        if (!response.ok) return;
        const data = await response.json();
        setApod(data);
      } catch (error) {
        setApodError(error.message);
      }
    }
    loadApod();
  }, []);

  useEffect(() => {
    async function loadDates() {
      if (!selectedDataset?.layerId || selectedDataset?.category !== 'earth') {
        setAvailableDates([]);
        return;
      }
      try {
        const response = await fetch(
          `/api/gibs/available-dates?layer=${selectedDataset.layerId}&days=${selectedDataset.timeRangeDays || 14}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.dates) && data.dates.length > 0) {
          setAvailableDates(data.dates);
          if (!data.dates.includes(selectedDate)) {
            setSelectedDate(data.dates[0]);
          }
        }
      } catch (error) {
        console.warn('Failed to load available dates', error);
      }
    }
    loadDates();
  }, [selectedDataset, selectedDate, setSelectedDate]);

  const saveAnnotations = async () => {
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations })
      });
      if (!response.ok) throw new Error('Failed to persist annotations');
    } catch (error) {
      console.error(error);
    }
  };

  const comparisonDatasets = datasets.filter((dataset) => dataset.id !== selectedDatasetId);

  const renderTimeControls = () => {
    if (!selectedDataset) return null;
    const label = selectedDataset.category === 'earth' ? 'Observation Date' : 'Reference Date';
    if (availableDates.length > 0) {
      const index = availableDates.indexOf(selectedDate);
      const sliderValue = index >= 0 ? index : 0;
      return (
        <div className="control-card">
          <h5>{label}</h5>
          <input
            className="time-slider"
            type="range"
            min={0}
            max={Math.max(availableDates.length - 1, 0)}
            value={sliderValue}
            onChange={(event) => {
              const idx = Number(event.target.value);
              const iso = availableDates[idx];
              if (iso) setSelectedDate(iso);
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>{availableDates[availableDates.length - 1]}</span>
            <span>{selectedDate}</span>
            <span>{availableDates[0]}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="control-card">
        <h5>{label}</h5>
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Zoomverse</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
            Navigate Earth, Moon, Mars &amp; deep space with live NASA missions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="status-pill">{datasetStatus === 'loading' ? 'Loading datasets…' : 'Live'}</span>
          {apod && (
            <a href={apod?.hdurl || apod?.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem' }}>
              APOD: {apod?.title}
            </a>
          )}
          {apodError && <span style={{ fontSize: '0.75rem' }}>APOD unavailable</span>}
        </div>
      </header>

      <aside className="app-sidebar">
        <div>
          <h3 className="section-title">Datasets</h3>
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className={`dataset-item ${dataset.id === selectedDatasetId ? 'active' : ''}`}
              onClick={() => selectDataset(dataset.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') selectDataset(dataset.id);
              }}
            >
              <h4>{dataset.name}</h4>
              <p>{dataset.description}</p>
              <div className="badge">{dataset.category.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="section-title">Overlays</h3>
          <div className="controls">
            {datasets
              .filter((dataset) => dataset.id !== selectedDatasetId)
              .map((dataset) => (
                <label key={dataset.id} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={overlays.includes(dataset.id)}
                    onChange={() => toggleOverlay(dataset.id)}
                  />
                  <span>{dataset.name}</span>
                </label>
              ))}
          </div>
        </div>

        {renderTimeControls()}

        <div className="control-card">
          <h5>Annotations</h5>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAnnotationMode('point')}
              style={{ opacity: annotationMode === 'point' ? 1 : 0.8 }}
            >
              Point
            </button>
            <button
              type="button"
              onClick={() => setAnnotationMode('polygon')}
              style={{ opacity: annotationMode === 'polygon' ? 1 : 0.8 }}
            >
              Polygon
            </button>
            <button type="button" onClick={() => setAnnotationMode('idle')}>
              Finish
            </button>
          </div>
          <p style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Draw on the map to annotate discoveries. Features auto-associate with the active dataset.
          </p>
        </div>

        <AnnotationPanel onSave={saveAnnotations} />
        <SnapshotExporter />
        <DeepSpaceSearch />
        <PlanetarySearch />
      </aside>

      <main className="app-main">
        <MapViewport />
        <div className="map-toolbar">
          {selectedDataset && (
            <div className="badge">
              {selectedDataset.name} ·
              {selectedDate ? ` ${format(parseISO(selectedDate), 'yyyy-MM-dd')}` : ' —'}
            </div>
          )}
          <button type="button" onClick={() => setComparisonEnabled(!comparisonEnabled)}>
            {comparisonEnabled ? 'Hide comparison' : 'Compare datasets'}
          </button>
        </div>
        {comparisonEnabled && (
          <div className="comparison-panel">
            <div className="comparison-toggle">
              <div>
                <strong style={{ fontSize: '0.85rem' }}>Side-by-side comparison</strong>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  Synchronised view with optional temporal offset.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={comparison.leftDatasetId || selectedDatasetId}
                  onChange={(event) => setComparison({ leftDatasetId: event.target.value })}
                >
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
                <select
                  value={comparison.rightDatasetId || comparisonDatasets[0]?.id || ''}
                  onChange={(event) => setComparison({ rightDatasetId: event.target.value })}
                >
                  {datasets
                    .filter((dataset) => dataset.id !== comparison.leftDatasetId)
                    .map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </option>
                    ))}
                </select>
                <label style={{ fontSize: '0.7rem' }}>
                  Δ days
                  <input
                    type="number"
                    value={comparison.dateOffsetDays}
                    onChange={(event) =>
                      setComparison({ dateOffsetDays: Number.parseInt(event.target.value || '0', 10) })
                    }
                    style={{ width: '5rem', marginLeft: '0.4rem' }}
                  />
                </label>
              </div>
            </div>
            <ComparisonMaps />
          </div>
        )}
      </main>
    </div>
  );
}
