/**
 * All Cypher lives here, in one place, fully parameterized.
 * No route ever concatenates user input into a query string.
 */

module.exports = {
  // ---------- Developers ----------
  LIST_DEVELOPERS: `
    MATCH (d:Developer)
    OPTIONAL MATCH (d)-[:HAS_SKILL]->(s:Skill)
    WITH d, collect(DISTINCT s.name) AS skills
    RETURN d { .id, .name, .title, .location, .avatarColor, .bio, skills: skills } AS developer
    ORDER BY d.name
  `,

  GET_DEVELOPER_BY_ID: `
    MATCH (d:Developer {id: $id})
    OPTIONAL MATCH (d)-[:HAS_SKILL]->(s:Skill)
    OPTIONAL MATCH (d)-[:WORKED_ON]->(p:Project)
    OPTIONAL MATCH (d)-[k:KNOWS]-(other:Developer)
    RETURN d { .id, .name, .title, .location, .avatarColor, .bio } AS developer,
           collect(DISTINCT s.name) AS skills,
           collect(DISTINCT p { .id, .name, .status }) AS projects,
           collect(DISTINCT other { .id, .name }) AS connections
  `,

  // ---------- Projects ----------
  LIST_PROJECTS: `
    MATCH (p:Project)
    OPTIONAL MATCH (d:Developer)-[:WORKED_ON]->(p)
    OPTIONAL MATCH (p)-[:USES_SKILL]->(s:Skill)
    WITH p, collect(DISTINCT d { .id, .name }) AS contributors, collect(DISTINCT s.name) AS skills
    RETURN p { .id, .name, .description, .status, .startDate }  AS project, contributors, skills
    ORDER BY p.name
  `,

  GET_PROJECT_BY_ID: `
    MATCH (p:Project {id: $id})
    OPTIONAL MATCH (d:Developer)-[:WORKED_ON]->(p)
    OPTIONAL MATCH (p)-[:USES_SKILL]->(s:Skill)
    RETURN p { .id, .name, .description, .status, .startDate } AS project,
           collect(DISTINCT d { .id, .name, .title }) AS contributors,
           collect(DISTINCT s.name) AS skills
  `,

  // ---------- Skills ----------
  LIST_SKILLS: `
    MATCH (s:Skill)
    OPTIONAL MATCH (d:Developer)-[:HAS_SKILL]->(s)
    WITH s, count(DISTINCT d) AS developerCount
    RETURN s { .id, .name, .category } AS skill, developerCount
    ORDER BY developerCount DESC, s.name
  `,

  // ---------- Whole-graph data for visualization ----------
  GET_GRAPH: `
    MATCH (n)
    WHERE n:Developer OR n:Project OR n:Skill
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE m:Developer OR m:Project OR m:Skill
    RETURN n, r, m
  `,

  // ---------- The "why graph DB" showcase queries ----------

  // Multi-hop: developers connected through two different projects who
  // also share at least one skill. A relational join for this would need
  // 3+ self-joins across a project_members table plus a skill-intersection
  // subquery; here it is a single readable pattern match.
  DEVELOPERS_CONNECTED_VIA_TWO_PROJECTS_SHARED_SKILL: `
    MATCH (a:Developer)-[:WORKED_ON]->(p1:Project)<-[:WORKED_ON]-(b:Developer)
    MATCH (a)-[:WORKED_ON]->(p2:Project)<-[:WORKED_ON]-(b)
    WHERE a.id < b.id AND p1 <> p2
    MATCH (a)-[:HAS_SKILL]->(shared:Skill)<-[:HAS_SKILL]-(b)
    RETURN a { .id, .name } AS developerA,
           b { .id, .name } AS developerB,
           collect(DISTINCT p1.name) + collect(DISTINCT p2.name) AS sharedProjects,
           collect(DISTINCT shared.name) AS sharedSkills
    ORDER BY developerA.name
    LIMIT 25
  `,

  // Shortest path between two developers through the KNOWS network.
  // Classic "graph DBs win" query — variable-length / shortest-path
  // traversal is native here and prohibitively slow as recursive SQL.
  SHORTEST_PATH_BETWEEN_DEVELOPERS: `
    MATCH (a:Developer {id: $fromId}), (b:Developer {id: $toId})
    MATCH path = shortestPath((a)-[:KNOWS*..8]-(b))
    RETURN [n IN nodes(path) | n { .id, .name }] AS nodes,
           length(path) AS hops
  `,

  // Skill recommendation: skills held by people you KNOW (1-2 hops) that
  // you don't have yet, ranked by popularity among your network.
  RECOMMEND_SKILLS_FOR_DEVELOPER: `
    MATCH (me:Developer {id: $id})-[:KNOWS*1..2]-(peer:Developer)-[:HAS_SKILL]->(s:Skill)
    WHERE NOT (me)-[:HAS_SKILL]->(s)
    RETURN s.name AS skill, count(DISTINCT peer) AS peerCount
    ORDER BY peerCount DESC
    LIMIT 10
  `,

  // Endorsement leaderboard per skill.
  TOP_ENDORSED_FOR_SKILL: `
    MATCH (d:Developer)-[e:ENDORSED]->(s:Skill {name: $skillName})
    RETURN d { .id, .name } AS developer, count(e) AS endorsements
    ORDER BY endorsements DESC
    LIMIT 10
  `,
};
