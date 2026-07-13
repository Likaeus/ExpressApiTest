const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeHeroPayload, validateHero } = require("../src/middleware/validateHero");
const { validateCredentials, validateRegistration } = require("../src/middleware/validateAuth");
const bcrypt = require("bcryptjs");
const rateLimitKey = require("../src/middleware/rateLimitKey");

test("normalizes both the new and legacy payload formats", () => {
  assert.deepEqual(normalizeHeroPayload({
    Name: "  Storm ",
    Description: "Mutant",
    Details: { Powers: "Weather", Weakness: "Claustrophobia" },
  }), {
    name: "Storm",
    description: "Mutant",
    details: { powers: "Weather", weakness: "Claustrophobia" },
    visibility: "public",
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

function responseRecorder() {
  const response = {};
  response.status = (code) => { response.statusCode = code; return response; };
  response.json = (body) => { response.body = body; return response; };
  return response;
}

test("normalizes login emails", () => {
  const req = { body: { email: "  USER@Example.COM ", password: "a-password" } };
  validateCredentials(req, responseRecorder(), () => {});
  assert.equal(req.credentials.email, "user@example.com");
});

test("rejects weak registration passwords", () => {
  const req = { body: { name: "User", email: "user@example.com", password: "password" } };
  const res = responseRecorder();
  validateRegistration(req, res, () => assert.fail("next should not be called"));
  assert.equal(res.statusCode, 422);
});

test("bcrypt hashes are salted and verifiable", async () => {
  const password = "StrongPassword123";
  const first = await bcrypt.hash(password, 4);
  const second = await bcrypt.hash(password, 4);
  assert.notEqual(first, second);
  assert.equal(await bcrypt.compare(password, first), true);
  assert.equal(await bcrypt.compare("wrong-password", first), false);
});

test("rate limit key uses Netlify forwarding headers and never returns undefined", () => {
  assert.equal(
    rateLimitKey({ headers: { "x-forwarded-for": "203.0.113.42, 10.0.0.1" } }),
    "203.0.113.42"
  );
  assert.equal(rateLimitKey({ headers: {}, socket: {} }), "unknown-client");
});
