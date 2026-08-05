// =============================================================
// Developer Networking Graph — reference Cypher queries
// Run these directly in the CognoDB Browser, or see
// backend/src/queries/cypherQueries.js for the parameterized
// versions actually used by the API.
// =============================================================

// -------------------------------------------------------------
// 0. Schema setup (idempotent)
// -------------------------------------------------------------
CREATE CONSTRAINT dev_id IF NOT EXISTS FOR (d:Developer) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT proj_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE;

// -------------------------------------------------------------
// 1. Basic reads
// -------------------------------------------------------------

// All developers with their skills
MATCH (d:Developer)
OPTIONAL MATCH (d)-[:HAS_SKILL]->(s:Skill)
RETURN d.name AS developer, collect(s.name) AS skills
ORDER BY d.name;

// A single project with contributors and required skills
MATCH (p:Project {id: $id})
OPTIONAL MATCH (d:Developer)-[:WORKED_ON]->(p)
OPTIONAL MATCH (p)-[:USES_SKILL]->(s:Skill)
RETURN p.name, collect(DISTINCT d.name) AS contributors, collect(DISTINCT s.name) AS skills;

// -------------------------------------------------------------
// 2. MULTI-HOP TRAVERSAL
// "Find developers connected through two different projects who
//  also share at least one skill."
//
// This is the query that motivates the whole assignment: in a
// relational model you'd need 2+ self-joins on a project_members
// table, a HAVING COUNT(DISTINCT project_id) >= 2, and a further
// EXISTS subquery against a developer_skills table just to check
// the shared-skill condition. In Cypher it's one readable pattern.
// -------------------------------------------------------------
MATCH (a:Developer)-[:WORKED_ON]->(p1:Project)<-[:WORKED_ON]-(b:Developer)
MATCH (a)-[:WORKED_ON]->(p2:Project)<-[:WORKED_ON]-(b)
WHERE a.id < b.id AND p1 <> p2
MATCH (a)-[:HAS_SKILL]->(shared:Skill)<-[:HAS_SKILL]-(b)
RETURN a.name AS developerA,
       b.name AS developerB,
       collect(DISTINCT p1.name) + collect(DISTINCT p2.name) AS sharedProjects,
       collect(DISTINCT shared.name) AS sharedSkills
ORDER BY developerA
LIMIT 25;

// -------------------------------------------------------------
// 3. SHORTEST PATH
// "Shortest path between two developers through the KNOWS network."
//
// Native shortestPath() traversal. The relational equivalent is a
// recursive CTE with a visited-set and depth cap — correct but
// verbose, and it degrades badly as the network grows. Graph DBs
// index adjacency directly, so this stays fast at any depth.
// -------------------------------------------------------------
MATCH (a:Developer {id: $fromId}), (b:Developer {id: $toId})
MATCH path = shortestPath((a)-[:KNOWS*..8]-(b))
RETURN [n IN nodes(path) | n.name] AS chain, length(path) AS hops;

// -------------------------------------------------------------
// 4. Skill recommendations from your extended network (1-2 hops)
// -------------------------------------------------------------
MATCH (me:Developer {id: $id})-[:KNOWS*1..2]-(peer:Developer)-[:HAS_SKILL]->(s:Skill)
WHERE NOT (me)-[:HAS_SKILL]->(s)
RETURN s.name AS skill, count(DISTINCT peer) AS peerCount
ORDER BY peerCount DESC
LIMIT 10;

// -------------------------------------------------------------
// 5. Top endorsed developers for a given skill
// -------------------------------------------------------------
MATCH (d:Developer)-[e:ENDORSED]->(s:Skill {name: $skillName})
RETURN d.name AS developer, count(e) AS endorsements
ORDER BY endorsements DESC
LIMIT 10;

// -------------------------------------------------------------
// 6. Whole-graph export for visualization
// -------------------------------------------------------------
MATCH (n)
WHERE n:Developer OR n:Project OR n:Skill
OPTIONAL MATCH (n)-[r]->(m)
WHERE m:Developer OR m:Project OR m:Skill
RETURN n, r, m;
