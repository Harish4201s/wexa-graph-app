import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import GraphVisualization from '../components/GraphVisualization';

const legend = [
  { label: 'Developer', color: '#6366f1' },
  { label: 'Project', color: '#f59e0b' },
  { label: 'Skill', color: '#10b981' },
];

export default function SkillGraphPage() {
  const { data, loading, error, refetch } = useApi(api.getGraph, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Skill Graph Visualization</h1>
        <p className="text-sm text-slate-500">
          The whole graph, rendered live from CognoDB. Drag nodes, scroll to zoom, hover for details.
        </p>
      </div>

      <div className="mb-4 flex gap-4">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {loading && <LoadingState label="Fetching graph from CognoDB…" />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && (!data?.nodes || data.nodes.length === 0) && (
        <EmptyState
          icon="🕸️"
          title="Graph is empty"
          subtitle="Run the seed script to populate developers, projects, and skills."
        />
      )}
      {!loading && !error && data?.nodes?.length > 0 && (
        <GraphVisualization nodes={data.nodes} links={data.links} />
      )}
    </div>
  );
}
