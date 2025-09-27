import useStore from '../state/useStore.js';

export default function AnnotationPanel({ onSave }) {
  const { annotations, clearAnnotations, setAnnotations } = useStore((state) => ({
    annotations: state.annotations,
    clearAnnotations: state.clearAnnotations,
    setAnnotations: state.setAnnotations
  }));

  const downloadGeoJSON = () => {
    const blob = new Blob([
      JSON.stringify({ type: 'FeatureCollection', features: annotations }, null, 2)
    ], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zoomverse-annotations.geojson';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          setAnnotations(data.features);
        }
      } catch (error) {
        console.error('Failed to import annotations', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="control-card">
      <h5>Annotations</h5>
      <div className="annotation-list">
        {annotations.length === 0 && <span>No annotations yet.</span>}
        {annotations.map((annotation) => (
          <div key={annotation.id} className="annotation-item">
            <strong>{annotation?.properties?.name || 'Unnamed feature'}</strong>
            <span>{new Date(annotation?.properties?.createdAt || Date.now()).toLocaleString()}</span>
            {annotation?.properties?.notes && <span>{annotation.properties.notes}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={onSave}>Save to backend</button>
        <button type="button" onClick={downloadGeoJSON}>Export GeoJSON</button>
        <label style={{ cursor: 'pointer' }}>
          Import
          <input type="file" accept="application/geo+json,.geojson" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <button type="button" onClick={clearAnnotations}>Clear</button>
      </div>
    </div>
  );
}
