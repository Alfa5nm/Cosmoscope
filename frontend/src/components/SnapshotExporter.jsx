import { useState } from 'react';
import { transformExtent } from 'ol/proj';
import useStore from '../state/useStore.js';

export default function SnapshotExporter() {
  const [message, setMessage] = useState(null);
  const {
    selectedDatasetId,
    datasets,
    selectedDate,
    mapExtent,
    snapshotStatus,
    snapshotData,
    setSnapshotStatus,
    setSnapshotData
  } = useStore((state) => ({
    selectedDatasetId: state.selectedDatasetId,
    datasets: state.datasets,
    selectedDate: state.selectedDate,
    mapExtent: state.mapExtent,
    snapshotStatus: state.snapshotStatus,
    snapshotData: state.snapshotData,
    setSnapshotStatus: state.setSnapshotStatus,
    setSnapshotData: state.setSnapshotData
  }));

  const dataset = datasets.find((item) => item.id === selectedDatasetId);

  const exportSnapshot = async () => {
    if (!dataset?.layerId) {
      setMessage('Snapshot export is available for NASA GIBS layers.');
      return;
    }
    setSnapshotStatus('loading');
    setMessage(null);

    const bbox = mapExtent
      ? transformExtent(mapExtent, 'EPSG:3857', 'EPSG:4326').map((value) => value.toFixed(4))
      : ['-180', '-90', '180', '90'];

    try {
      const response = await fetch('/api/worldview/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: selectedDate,
          bbox: bbox.join(','),
          layers: dataset.layerId,
          width: 2048,
          height: 2048,
          format: 'image/png'
        })
      });
      if (!response.ok) {
        throw new Error(`Snapshot failed with status ${response.status}`);
      }
      const data = await response.json();
      setSnapshotData(data);
      setSnapshotStatus('ready');
      setMessage('Snapshot ready – click to download.');
    } catch (error) {
      console.error(error);
      setSnapshotStatus('error');
      setMessage(error.message);
    }
  };

  const downloadSnapshot = () => {
    if (!snapshotData) return;
    const blob = b64toBlob(snapshotData.data, snapshotData.contentType);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zoomverse-${dataset?.layerId || 'snapshot'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="control-card">
      <h5>Worldview Snapshot</h5>
      <p style={{ fontSize: '0.75rem', marginTop: 0 }}>
        Export the visible extent using NASA Worldview Snapshots API. Works best with MODIS &amp; VIIRS layers.
      </p>
      <button type="button" onClick={exportSnapshot} disabled={snapshotStatus === 'loading'}>
        {snapshotStatus === 'loading' ? 'Requesting…' : 'Request Snapshot'}
      </button>
      {snapshotStatus === 'ready' && snapshotData && (
        <button type="button" onClick={downloadSnapshot}>Download PNG</button>
      )}
      {message && <p style={{ fontSize: '0.75rem' }}>{message}</p>}
    </div>
  );
}

function b64toBlob(b64Data, contentType) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  const sliceSize = 512;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}
