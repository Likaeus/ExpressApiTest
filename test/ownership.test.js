const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Hero = require("../Models/HeroCardModel");
const { ownershipFilter, serialize } = require("../src/controllers/heroController");

test("hero schema stores an indexed owner id", () => {
  const ownerPath = Hero.schema.path("ownerId");
  assert.ok(ownerPath);
  assert.equal(ownerPath.instance, "ObjectId");
  assert.equal(ownerPath.options.index, true);
});

test("hero schema supports private creations and creator attribution", () => {
  assert.deepEqual(Hero.schema.path("visibility").enumValues, ["public", "private"]);
  assert.ok(Hero.schema.path("creatorName"));
});

test("regular users can only mutate heroes they own", () => {
  const userId = new mongoose.Types.ObjectId();
  assert.deepEqual(ownershipFilter("hero-id", { _id: userId, role: "user" }), {
    _id: "hero-id",
    ownerId: userId,
  });
});

test("administrators can mutate any hero", () => {
  assert.deepEqual(ownershipFilter("hero-id", { _id: new mongoose.Types.ObjectId(), role: "admin" }), {
    _id: "hero-id",
  });
});

test("serialized heroes identify ownership without exposing ownerId", () => {
  const ownerId = new mongoose.Types.ObjectId();
  const hero = {
    _id: new mongoose.Types.ObjectId(),
    Name: "Owner test",
    Description: "Description",
    Details: { Powers: "Power", Weakness: "Weakness" },
    ownerId,
  };
  const result = serialize(hero, ownerId);
  assert.equal(result.isOwnedByCurrentUser, true);
  assert.equal("ownerId" in result, false);
  assert.equal(result.visibility, "public");
  assert.equal(result.creatorName, "Comunidad del enclave");
});
