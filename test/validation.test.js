const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeHeroPayload, validateHero } = require("../src/middleware/validateHero");

test("normalizes both the new and legacy payload formats", () => {
  assert.deepEqual(normalizeHeroPayload({
    Name: "  Storm ",
    Description: "Mutant",
    Details: { Powers: "Weather", Weakness: "Claustrophobia" },
  }), {
    name: "Storm",
    description: "Mutant",
    details: { powers: "Weather", weakness: "Claustrophobia" },
  });
});

test("returns 422 when required fields are missing", () => {
  const req = { body: { name: "Storm" } };
  let response;
  const res = {
    status(code) { response = { code }; return this; },
    json(body) { response.body = body; return this; },
  };

  validateHero(req, res, () => assert.fail("next should not be called"));
  assert.equal(response.code, 422);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});

test("places a normalized valid payload on the request", () => {
  const req = { body: {
    name: "Storm", description: "Mutant",
    details: { powers: "Weather", weakness: "Claustrophobia" },
  } };
  validateHero(req, {}, () => {});
  assert.equal(req.heroPayload.name, "Storm");
});
