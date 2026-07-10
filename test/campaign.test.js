const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
process.env.DATABASE_URL ||= "mongodb://127.0.0.1:27017/test";
process.env.JWT_SECRET ||= "test-secret-with-at-least-thirty-two-characters";
const Campaign = require("../src/models/Campaign");
const { normalizeCampaignPayload, validateCampaign } = require("../src/middleware/validateCampaign");
const { ownershipFilter, serialize, slugify } = require("../src/controllers/campaignController");

const validPayload = {
  name: "El Reino Quebrado",
  shortDescription: "Una corona perdida divide el continente.",
  description: "Los antiguos aliados compiten por reclamar el trono.",
  system: "Daggerheart",
  genres: ["Política", "Exploración"],
  tone: "Fantasía heroica",
  status: "planning",
  visibility: "public",
  playerCount: { min: 3, max: 5 },
  map: { seed: "reino-42", parameters: { size: "large", landform: "continents", climate: "temperate" } },
};

test("campaign payload is normalized with safe map defaults", () => {
  const result = normalizeCampaignPayload({ ...validPayload, name: "  El Reino Quebrado  " });
  assert.equal(result.name, "El Reino Quebrado");
  assert.equal(result.map.provider, "seed-preview");
  assert.equal(result.map.generatorVersion, "epic-preview-1");
});

test("campaign validation rejects an inverted player range", () => {
  const req = { body: { ...validPayload, playerCount: { min: 8, max: 2 } } };
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  validateCampaign(req, res, () => assert.fail("next should not be called"));
  assert.equal(res.statusCode, 422);
  assert.match(res.body.error.message, /playerCount/);
});

test("campaign validation places normalized data on the request", () => {
  const req = { body: validPayload };
  validateCampaign(req, {}, () => {});
  assert.equal(req.campaignPayload.map.seed, "reino-42");
  assert.deepEqual(req.campaignPayload.genres, ["Política", "Exploración"]);
});

test("campaign schema uses the configured collection and owner index", () => {
  assert.equal(Campaign.collection.name, "Campaigns");
  assert.equal(Campaign.schema.path("ownerId").options.index, true);
});

test("campaign ownership and serialization do not expose ownerId", () => {
  const ownerId = new mongoose.Types.ObjectId();
  assert.deepEqual(ownershipFilter("campaign-id", { _id: ownerId, role: "user" }), { _id: "campaign-id", ownerId });
  const result = serialize({ _id: new mongoose.Types.ObjectId(), ownerId, name: "Test", map: {} }, ownerId);
  assert.equal(result.isOwnedByCurrentUser, true);
  assert.equal("ownerId" in result, false);
});

test("campaign slugs are URL-safe and preserve a useful name", () => {
  assert.equal(slugify("El Reino Mágico"), "el-reino-magico");
});
