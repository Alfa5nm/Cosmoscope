import { useState } from 'react';
import useStore from '../state/useStore.js';

export default function DeepSpaceSearch() {
  const [target, setTarget] = useState('Andromeda');
  const [collection, setCollection] = useState('HST');
  const { mastResults, mastStatus, mastError, setMastStatus, setMastResults, setMastError } =
    useStore((state) => ({
      mastResults: state.mastResults,
      mastStatus: state.mastStatus,
      mastError: state.mastError,
      setMastStatus: state.setMastStatus,
      setMastResults: state.setMastResults,
      setMastError: state.setMastError
    }));

  const search = async (event) => {
    event.preventDefault();
    setMastStatus('loading');
    setMastError(null);
    try {
      const url = new URL('/api/mast/search', window.location.origin);
      url.searchParams.set('target', target);
      url.searchParams.set('collection', collection);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`MAST request failed: ${response.status}`);
      }
      const data = await response.json();
      const results = Array.isArray(data?.data) ? data.data : data?.queryResult?.records || [];
      setMastResults(results);
      setMastStatus('ready');
    } catch (error) {
      setMastError(error.message);
      setMastStatus('error');
    }
  };

  return (
    <div className="control-card">
      <h5>Deep Space · MAST</h5>
      <form onSubmit={search} style={{ display: 'grid', gap: '0.5rem' }}>
        <label>
          Target Name
          <input value={target} onChange={(event) => setTarget(event.target.value)} required />
        </label>
        <label>
          Collection
          <select value={collection} onChange={(event) => setCollection(event.target.value)}>
            <option value="HST">HST (Hubble)</option>
            <option value="JWST">JWST</option>
            <option value="TESS">TESS</option>
          </select>
        </label>
        <button type="submit" disabled={mastStatus === 'loading'}>
          {mastStatus === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>
      {mastError && <p style={{ color: '#ffb4a2' }}>{mastError}</p>}
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto' }}>
        {mastResults.map((result) => (
          <div key={result.obsid || result.obs_id || Math.random()} style={{ fontSize: '0.75rem' }}>
            <strong>{result.obs_title || result.target_name || 'Observation'}</strong>
            <div>{result.filters || result.instrument_name}</div>
            {result.dataURL && (
              <a href={result.dataURL} target="_blank" rel="noreferrer">
                Open dataset
              </a>
            )}
          </div>
        ))}
        {mastStatus === 'ready' && mastResults.length === 0 && <span>No datasets returned.</span>}
      </div>
    </div>
  );
}
