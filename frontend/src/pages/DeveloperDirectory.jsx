import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ShortestPathFinder from '../components/ShortestPathFinder';

function DeveloperCard({ dev }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: dev.avatarColor || '#6366f1' }}
        >
          {dev.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{dev.name}</p>
          <p className="truncate text-xs text-slate-500">{dev.title} · {dev.location}</p>
        </div>
      </div>
      {dev.bio && <p className="mt-3 text-sm text-slate-600">{dev.bio}</p>}
      {dev.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dev.skills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DeveloperDirectory() {
  const { data, loading, error, refetch } = useApi(api.listDevelopers, []);
  const [query, setQuery] = useState('');

  const developers = data?.developers || [];

  const filtered = useMemo(() => {
    if (!query.trim()) return developers;
    const q = query.toLowerCase();
    return developers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q) ||
        d.skills?.some((s) => s.toLowerCase().includes(q))
    );
  }, [developers, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Developer Directory</h1>
        <p className="text-sm text-slate-500">
          Browse developers, their skills, and how they connect to each other and to projects.
        </p>
      </div>

      <ShortestPathFinder developers={developers} />

      <div className="mt-8 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, title, or skill…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {loading && <LoadingState label="Loading developers…" />}
      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={refetch}
        />
      )}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="🧑‍💻"
          title="No developers found"
          subtitle={query ? `No matches for "${query}".` : 'The directory is currently empty.'}
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dev) => (
            <DeveloperCard key={dev.id} dev={dev} />
          ))}
        </div>
      )}
    </div>
  );
}
