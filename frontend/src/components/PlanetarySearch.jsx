import { useState } from 'react';
import useStore from '../state/useStore.js';

export default function PlanetarySearch() {
  const [query, setQuery] = useState('LROC NAC');
  const { pdsResults, pdsStatus, pdsError, setPdsStatus, setPdsResults, setPdsError } =
    useStore((state) => ({
      pdsResults: state.pdsResults,
      pdsStatus: state.pdsStatus,
      pdsError: state.pdsError,
      setPdsStatus: state.setPdsStatus,
      setPdsResults: state.setPdsResults,
      setPdsError: state.setPdsError
    }));

  const search = async (event) => {
    event.preventDefault();
    setPdsStatus('loading');
    setPdsError(null);
    try {
      const url = new URL('/api/pds/search', window.location.origin);
      url.searchParams.set('q', query);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`PDS request failed: ${response.status}`);
      }
      const data = await response.json();
      const results = data?.data ?? data?.items ?? [];
      setPdsResults(results);
      setPdsStatus('ready');
    } catch (error) {
      setPdsError(error.message);
      setPdsStatus('error');
    }
  };

  return (
    <div className="control-card">
      <h5>Planetary Data · PDS</h5>
      <form onSubmit={search} style={{ display: 'grid', gap: '0.5rem' }}>
        <label>
          Search Query
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button type="submit" disabled={pdsStatus === 'loading'}>
          {pdsStatus === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>
      {pdsError && <p style={{ color: '#ffb4a2' }}>{pdsError}</p>}
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto' }}>
        {pdsResults.map((result) => (
          <div key={result.id || result.uid || result.title} style={{ fontSize: '0.75rem' }}>
            <strong>{result.title || result?.product_name || 'Product'}</strong>
            {result.description && <div>{result.description}</div>}
            {result.links?.[0]?.href && (
              <a href={result.links[0].href} target="_blank" rel="noreferrer">
                Open product
              </a>
            )}
          </div>
        ))}
        {pdsStatus === 'ready' && pdsResults.length === 0 && <span>No results.</span>}
      </div>
    </div>
  );
}
