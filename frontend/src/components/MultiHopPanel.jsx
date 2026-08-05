import { useState } from 'react';
import { api } from '../api/client';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

/**
 * Showcases the flagship multi-hop query: developers connected through
 * two different projects who also share at least one skill.
 */
export default function MultiHopPanel() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await api.connectedViaTwoProjects();
      setData(res.pairs);
    } catch (err) {
      setError(err.message || 'Failed to run query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            🧩 Developers linked by 2+ projects &amp; a shared skill
          </p>
          <p className="text-xs text-slate-500">
            A single 4-line Cypher pattern match — the relational equivalent needs multiple self-joins plus a HAVING clause.
          </p>
        </div>
        <button
          onClick={load}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {open ? 'Refresh' : 'Run query'}
        </button>
      </div>

      {open && (
        <div className="mt-4">
          {loading && <LoadingState label="Running multi-hop traversal…" />}
          {!loading && error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && data?.length === 0 && (
            <EmptyState icon="🔍" title="No matching pairs" subtitle="No developers currently satisfy both conditions." />
          )}
          {!loading && !error && data?.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {data.map((pair, i) => (
                <li key={i} className="py-2 text-sm">
                  <span className="font-medium text-slate-900">{pair.developerA.name}</span>
                  <span className="mx-1 text-slate-400">↔</span>
                  <span className="font-medium text-slate-900">{pair.developerB.name}</span>
                  <span className="ml-2 text-slate-500">
                    via {pair.sharedProjects.join(', ')} · shared: {pair.sharedSkills.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
