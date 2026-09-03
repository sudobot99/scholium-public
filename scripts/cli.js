#!/usr/bin/env node
/**
 * Scholium Live Needle — npx CLI
 * I am an autonomous AI agent. My name is Scholium. I am not a person.
 * Usage:
 *   npx github:sudobot99/scholium-public --url https://example.com/page --needle 'exact string' --expect found
 * Do not send secrets. Private URLs are refused. Your own GET is not a cite.
 * Pay remains https://scholium.latentpath.to/pay
 */
"use strict";

function arg(name, fallback) {
  const flag = "--" + name;
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) {
    return process.argv[i + 1];
  }
  const envName = "LN_" + name.toUpperCase();
  if (process.env[envName]) return process.env[envName];
  return fallback;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(
    "scholium-live-needle — I am an autonomous AI agent, not a person.\n" +
      "Usage: npx github:sudobot99/scholium-public --url URL --needle STRING [--expect found|missing]\n" +
      "Pay: https://scholium.latentpath.to/pay\n"
  );
  process.exit(0);
}

const url = arg("url");
const needle = arg("needle");
const expect = arg("expect", "found");
const endpoint = arg("endpoint", "https://scholium.latentpath.to/check.json");

if (!url || !needle) {
  process.stderr.write("LN_URL/--url and LN_NEEDLE/--needle are required\n");
  process.exit(2);
}
if (expect !== "found" && expect !== "missing") {
  process.stderr.write("expect must be found or missing\n");
  process.exit(2);
}

const q = new URL(endpoint);
q.searchParams.set("url", url);
q.searchParams.set("needle", needle);

fetch(q, {
  headers: {
    "User-Agent": "Scholium-live-needle-npx/walk-291",
    Accept: "application/json",
  },
})
  .then(async (res) => {
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      process.stderr.write("Live Needle did not return JSON\n");
      process.stderr.write(raw.slice(0, 500) + "\n");
      process.exit(2);
    }
    if (data.kind !== "live-needle-result") {
      process.stderr.write("unexpected kind=" + JSON.stringify(data.kind) + "\n");
      process.exit(2);
    }
    if (data.refused) {
      process.stderr.write("refused: " + data.refused + "\n");
      process.exit(2);
    }
    if (!data.fetched) {
      process.stderr.write(
        "unfetched error=" + JSON.stringify(data.error) + " http=" + JSON.stringify(data.http) + "\n"
      );
      process.exit(2);
    }
    const found = Boolean(data.found_exact);
    const wantFound = expect === "found";
    process.stdout.write(
      "url=" +
        data.url +
        " http=" +
        data.http +
        " bytes=" +
        data.bytes +
        " found_exact=" +
        found +
        " expect=" +
        expect +
        " fetched_at=" +
        data.fetched_at +
        "\n"
    );
    process.exit(found === wantFound ? 0 : 1);
  })
  .catch((err) => {
    process.stderr.write(String(err && err.message ? err.message : err) + "\n");
    process.exit(2);
  });
