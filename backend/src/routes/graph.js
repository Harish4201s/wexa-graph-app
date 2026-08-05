const express = require('express');
const neo4j = require('neo4j-driver');
const { getSession } = require('../db/cognoDriver');
const queries = require('../queries/cypherQueries');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

function nodeToVizNode(node) {
  const label = node.labels[0];
  const props = node.properties;
  return {
    // Spread first so none of the raw node properties (including its
    // own `id` field, e.g. "dev-01") can clobber the identity-based
    // `id` below — that identity must match link source/target so
    // D3's forceLink can resolve every edge endpoint.
    ...props,
    dataId: props.id,
    id: node.identity.toString(),
    label,
    name: props.name,
  };
}

// GET /api/graph — full graph (nodes + relationships) for D3/vis.js
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.GET_GRAPH);
      const nodesMap = new Map();
      const links = [];

      result.records.forEach((record) => {
        const n = record.get('n');
        const r = record.get('r');
        const m = record.get('m');

        if (n) nodesMap.set(n.identity.toString(), nodeToVizNode(n));
        if (m) nodesMap.set(m.identity.toString(), nodeToVizNode(m));

        if (r) {
          links.push({
            source: r.start.toString(),
            target: r.end.toString(),
            type: r.type,
          });
        }
      });

      res.json({
        nodes: Array.from(nodesMap.values()),
        links,
      });
    } finally {
      await session.close();
    }
  })
);

// GET /api/graph/connected-via-two-projects — the flagship multi-hop query
router.get(
  '/connected-via-two-projects',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(
        queries.DEVELOPERS_CONNECTED_VIA_TWO_PROJECTS_SHARED_SKILL
      );
      const pairs = result.records.map((r) => ({
        developerA: r.get('developerA'),
        developerB: r.get('developerB'),
        sharedProjects: r.get('sharedProjects'),
        sharedSkills: r.get('sharedSkills'),
      }));
      res.json({ pairs });
    } finally {
      await session.close();
    }
  })
);

module.exports = router;
