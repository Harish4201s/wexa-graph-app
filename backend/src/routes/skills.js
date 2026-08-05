const express = require('express');
const { getSession } = require('../db/cognoDriver');
const queries = require('../queries/cypherQueries');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/skills — list with developer counts
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.LIST_SKILLS);
      const skills = result.records.map((r) => ({
        ...r.get('skill'),
        developerCount: r.get('developerCount').toNumber
          ? r.get('developerCount').toNumber()
          : r.get('developerCount'),
      }));
      res.json({ skills });
    } finally {
      await session.close();
    }
  })
);

// GET /api/skills/:name/top-endorsed
router.get(
  '/:name/top-endorsed',
  asyncHandler(async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(queries.TOP_ENDORSED_FOR_SKILL, {
        skillName: req.params.name,
      });
      const leaders = result.records.map((r) => ({
        developer: r.get('developer'),
        endorsements: r.get('endorsements').toNumber
          ? r.get('endorsements').toNumber()
          : r.get('endorsements'),
      }));
      res.json({ leaders });
    } finally {
      await session.close();
    }
  })
);

module.exports = router;
