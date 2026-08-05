/**
 * Seed script — loads developers, projects, skills, and their
 * relationships into CognoDB.
 *
 * Usage:
 *   cd backend && npm run seed
 *   (or: node data/seed.js  — from the repo root, with backend/.env present)
 *
 * All writes use parameterized Cypher (no string concatenation).
 * Safe to re-run: constraints + MERGE make this idempotent.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');

const developers = require('./developers.json');
const projects = require('./projects.json');
const skills = require('./skills.json');
const relationships = require('./relationships.json');

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER;
const password = process.env.COGNODB_PASSWORD;
const database = process.env.COGNODB_DATABASE || 'neo4j';

if (!uri || !user || !password) {
  console.error(
    '❌ Missing COGNODB_URI / COGNODB_USER / COGNODB_PASSWORD. Set them in backend/.env before seeding.'
  );
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function run(session, query, params = {}) {
  return session.executeWrite((tx) => tx.run(query, params));
}

async function ensureConstraints(session) {
  const constraints = [
    'CREATE CONSTRAINT dev_id IF NOT EXISTS FOR (d:Developer) REQUIRE d.id IS UNIQUE',
    'CREATE CONSTRAINT proj_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE',
    'CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE',
  ];
  for (const c of constraints) {
    await session.executeWrite((tx) => tx.run(c));
  }
}

async function seedNodes(session) {
  await run(
    session,
    `UNWIND $rows AS row
     MERGE (d:Developer {id: row.id})
     SET d += row`,
    { rows: developers }
  );

  await run(
    session,
    `UNWIND $rows AS row
     MERGE (p:Project {id: row.id})
     SET p += row`,
    { rows: projects }
  );

  await run(
    session,
    `UNWIND $rows AS row
     MERGE (s:Skill {id: row.id})
     SET s += row`,
    { rows: skills }
  );

  console.log(
    `✅ Nodes: ${developers.length} developers, ${projects.length} projects, ${skills.length} skills`
  );
}

function skillIdToName(skillId) {
  const skill = skills.find((s) => s.id === skillId);
  return skill ? skill.name : skillId;
}

async function seedRelationships(session) {
  await run(
    session,
    `UNWIND $rows AS row
     MATCH (d:Developer {id: row.developer}), (s:Skill {id: row.skill})
     MERGE (d)-[:HAS_SKILL]->(s)`,
    { rows: relationships.HAS_SKILL }
  );

  await run(
    session,
    `UNWIND $rows AS row
     MATCH (d:Developer {id: row.developer}), (p:Project {id: row.project})
     MERGE (d)-[r:WORKED_ON]->(p)
     SET r.role = row.role`,
    { rows: relationships.WORKED_ON }
  );

  await run(
    session,
    `UNWIND $rows AS row
     MATCH (p:Project {id: row.project}), (s:Skill {id: row.skill})
     MERGE (p)-[:USES_SKILL]->(s)`,
    { rows: relationships.USES_SKILL }
  );

  await run(
    session,
    `UNWIND $rows AS row
     MATCH (a:Developer {id: row.from}), (b:Developer {id: row.to})
     MERGE (a)-[r:KNOWS]-(b)
     SET r.since = row.since`,
    { rows: relationships.KNOWS }
  );

  // ENDORSED needs the skill *name* resolved server-side too, but since
  // our JSON already stores skill ids consistently we join on id, then
  // also stamp the human-readable skill name for convenience in queries
  // that filter ENDORSED by name.
  const endorsedRows = relationships.ENDORSED.map((e) => ({
    ...e,
    skillName: skillIdToName(e.skill),
  }));

  await run(
    session,
    `UNWIND $rows AS row
     MATCH (a:Developer {id: row.from}), (b:Developer {id: row.to}), (s:Skill {id: row.skill})
     MERGE (a)-[r:ENDORSED]->(b)
     SET r.skill = s.name, r.weight = row.weight`,
    { rows: endorsedRows }
  );

  console.log(
    `✅ Relationships: HAS_SKILL(${relationships.HAS_SKILL.length}), WORKED_ON(${relationships.WORKED_ON.length}), USES_SKILL(${relationships.USES_SKILL.length}), KNOWS(${relationships.KNOWS.length}), ENDORSED(${relationships.ENDORSED.length})`
  );
}

async function main() {
  const session = driver.session({ database });
  try {
    console.log(`Connecting to CognoDB at ${uri} (db: ${database})...`);
    await driver.verifyConnectivity();
    console.log('✅ Connected');

    await ensureConstraints(session);
    await seedNodes(session);
    await seedRelationships(session);

    console.log('🎉 Seed complete.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
