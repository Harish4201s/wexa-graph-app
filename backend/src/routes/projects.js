const express = require('express');
const { getSession } = require('../db/cognoDriver');
const queries = require('../queries/cypherQueries');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/projects — explorer listing with contributors & skills
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.LIST_PROJECTS);
      const projects = result.records.map((r) => ({
        ...r.get('project'),
        contributors: r.get('contributors'),
        skills: r.get('skills'),
      }));
      res.json({ projects });
    } finally {
      await session.close();
    }
  })
);

// GET /api/projects/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.GET_PROJECT_BY_ID, {
        id: req.params.id,
      });
      if (result.records.length === 0 || !result.records[0].get('project')) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const record = result.records[0];
      res.json({
        project: record.get('project'),
        contributors: record.get('contributors'),
        skills: record.get('skills'),
      });
    } finally {
      await session.close();
    }
  })
);

module.exports = router;
