import { useState } from 'react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import MultiHopPanel from '../components/MultiHopPanel';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
};

function ProjectCard({ project }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{project.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            statusStyles[project.status] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {project.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{project.description}</p>

      {project.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skills.map((s) => (
            <span key={s} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {s}
            </span>
          ))}
        </div>
      )}

      {project.contributors?.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Contributors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.contributors.map((c) => (
              <span key={c.id} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectExplorer() {
  const { data, loading, error, refetch } = useApi(api.listProjects, []);
  const [statusFilter, setStatusFilter] = useState('all');

  const projects = data?.projects || [];
  const filtered =
    statusFilter === 'all' ? projects : projects.filter((p) => p.status === statusFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Project Explorer</h1>
        <p className="text-sm text-slate-500">
          See what's being built, which skills each project relies on, and who's contributing.
        </p>
      </div>

      <MultiHopPanel />

      <div className="mt-8 mb-4 flex gap-2">
        {['all', 'active', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <LoadingState label="Loading projects…" />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="📁"
          title="No projects found"
          subtitle="Try a different status filter, or check back once projects are added."
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
