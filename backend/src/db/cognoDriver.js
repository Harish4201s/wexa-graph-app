/**
 * CognoDB connection layer.
 *
 * CognoDB exposes openCypher over the Bolt protocol and is wire-compatible
 * with the official Neo4j JavaScript driver, so we reuse `neo4j-driver`
 * as our client. All connection details are read from environment
 * variables — nothing is ever hard-coded or committed.
 */
const neo4j = require('neo4j-driver');

let driver = null;

function getDriver() {
  if (driver) return driver;

  const uri = process.env.COGNODB_URI;
  const user = process.env.COGNODB_USER;
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !user || !password) {
    throw new Error(
      'Missing CognoDB connection env vars. Please set COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD.'
    );
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 10000,
  });

  return driver;
}

/**
 * Verifies connectivity at startup. Does not throw — callers decide
 * how to handle a down database (we keep the API up and return 503s
 * on data routes instead of crashing the whole server).
 */
async function verifyConnectivity() {
  try {
    const d = getDriver();
    await d.verifyConnectivity();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function getSession() {
  const database = process.env.COGNODB_DATABASE || 'neo4j';
  return getDriver().session({ database });
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = { getDriver, getSession, verifyConnectivity, closeDriver };
