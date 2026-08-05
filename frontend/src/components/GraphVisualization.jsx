import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const COLORS = {
  Developer: '#6366f1',
  Project: '#f59e0b',
  Skill: '#10b981',
};

const RADIUS = {
  Developer: 10,
  Project: 9,
  Skill: 7,
};

/**
 * Force-directed graph of Developer / Project / Skill nodes and their
 * relationships, rendered with D3. Nodes are draggable; hover shows a
 * tooltip; click focuses connected edges.
 */
export default function GraphVisualization({ nodes, links, height = 560 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!nodes?.length || !svgRef.current) return;

    const width = containerRef.current?.clientWidth || 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g');

    // Zoom / pan
    svg.call(
      d3
        .zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    const linkNodes = links.map((l) => ({ ...l }));
    const nodeNodes = nodes.map((n) => ({ ...n }));

    const simulation = d3
      .forceSimulation(nodeNodes)
      .force(
        'link',
        d3
          .forceLink(linkNodes)
          .id((d) => d.id)
          .distance(70)
          .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(-160))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => (RADIUS[d.label] || 8) + 6));

    const link = g
      .append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(linkNodes)
      .join('line')
      .attr('stroke-width', 1.2);

    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodeNodes)
      .join('circle')
      .attr('r', (d) => RADIUS[d.label] || 8)
      .attr('fill', (d) => COLORS[d.label] || '#94a3b8')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'grab')
      .call(drag(simulation));

    const label = g
      .append('g')
      .selectAll('text')
      .data(nodeNodes)
      .join('text')
      .text((d) => d.name)
      .attr('font-size', 9)
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('fill', '#475569')
      .style('pointer-events', 'none');

    node.append('title').text((d) => `${d.label}: ${d.name}`);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
      label.attr('x', (d) => d.x).attr('y', (d) => d.y);
    });

    function drag(sim) {
      function dragstarted(event, d) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event, d) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }

    return () => simulation.stop();
  }, [nodes, links, height]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <svg ref={svgRef} width="100%" height={height} />
    </div>
  );
}
