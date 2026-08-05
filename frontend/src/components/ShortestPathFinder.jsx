import { useState } from 'react';
import { api, ApiError } from '../api/client';

/**
 * Demonstrates the query relational DBs struggle with: shortest path
 * between two developers through the KNOWS network, computed natively
 * with Cypher's shortestPath().
 */
export default function ShortestPathFinder({ developers }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSearch = fromId && toId && fromId !== toId;

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.getShortestPath(fromId, toId);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to compute path.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-slate-900">
        🔗 Shortest path between two developers
      </p>
      <p className="mb-3 text-xs text-slate-500">
        Native graph traversal via <code className="rounded bg-slate-100 px-1">shortestPath()</code> over the KNOWS network — the kind of multi-hop query that's slow and awkward in a relational schema.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">From developer…</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <span className="text-slate-400">→</span>
        <select
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">To developer…</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          disabled={!canSearch || loading}
          onClick={handleSearch}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Find path'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && result.path === null && (
        <p className="mt-3 text-sm text-slate-500">No connection found between these two developers.</p>
      )}

      {result && result.path && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {result.path.map((node, idx) => (
            <span key={node.id} className="flex items-center gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                {node.name}
              </span>
              {idx < result.path.length - 1 && <span className="text-slate-400">→</span>}
            </span>
          ))}
          <span className="ml-2 text-xs text-slate-500">({result.hops} hop{result.hops === 1 ? '' : 's'})</span>
        </div>
      )}
    </div>
  );
}
