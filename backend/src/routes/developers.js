const express = require('express');
const { getSession } = require('../db/cognoDriver');
const queries = require('../queries/cypherQueries');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/developers — directory listing
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.LIST_DEVELOPERS);
      const developers = result.records.map((r) => r.get('developer'));
      res.json({ developers });
    } finally {
      await session.close();
    }
  })
);

// GET /api/developers/:id — profile with skills, projects, connections
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.GET_DEVELOPER_BY_ID, {
        id: req.params.id,
      });
      if (result.records.length === 0 || !result.records[0].get('developer')) {
        return res.status(404).json({ error: 'Developer not found' });
      }
      const record = result.records[0];
      res.json({
        developer: record.get('developer'),
        skills: record.get('skills'),
        projects: record.get('projects'),
        connections: record.get('connections'),
      });
    } finally {
      await session.close();
    }
  })
);

// GET /api/developers/:id/recommendations — skills your network has that you don't
router.get(
  '/:id/recommendations',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.RECOMMEND_SKILLS_FOR_DEVELOPER, {
        id: req.params.id,
      });
      const recommendations = result.records.map((r) => ({
        skill: r.get('skill'),
        peerCount: r.get('peerCount').toNumber
          ? r.get('peerCount').toNumber()
          : r.get('peerCount'),
      }));
      res.json({ recommendations });
    } finally {
      await session.close();
    }
  })
);

// GET /api/developers/path/:fromId/:toId — shortest path via KNOWS network
router.get(
  '/path/:fromId/:toId',
  asyncHandler(async (req, res) => {
    const { fromId, toId } = req.params;
    const session = getSession();
    try {
      const result = await session.run(queries.SHORTEST_PATH_BETWEEN_DEVELOPERS, {
        fromId,
        toId,
      });
      if (result.records.length === 0) {
        return res.json({ path: null, hops: null, message: 'No connection found' });
      }
      const record = result.records[0];
      res.json({
        path: record.get('nodes'),
        hops: record.get('hops').toNumber ? record.get('hops').toNumber() : record.get('hops'),
      });
    } finally {
      await session.close();
    }
  })
);

module.exports = router;
