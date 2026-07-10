const Hero = require("../../Models/HeroCardModel");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function serialize(hero, currentUserId) {
  const value = hero.toObject ? hero.toObject() : hero;
  return {
    id: value._id,
    name: value.Name,
    description: value.Description,
    details: {
      powers: value.Details.Powers,
      weakness: value.Details.Weakness,
    },
    imageUrl: value.Image?.contentType ? `/api/v1/heroes/${value._id}/image` : null,
    isOwnedByCurrentUser: Boolean(
      currentUserId && value.ownerId && value.ownerId.toString() === currentUserId.toString()
    ),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function databasePayload(payload) {
  return {
    Name: payload.name,
    Description: payload.description,
    Details: {
      Powers: payload.details.powers,
      Weakness: payload.details.weakness,
    },
  };
}

function serializeLegacy(hero) {
  const value = hero.toObject ? hero.toObject() : hero;
  return {
    _id: value._id,
    Name: value.Name,
    Description: value.Description,
    Details: value.Details,
    Image: value.Image?.contentType ? { contentType: value.Image.contentType } : null,
  };
}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? Math.min(number, maximum) : fallback;
}

function ownershipFilter(id, user) {
  return user.role === "admin" ? { _id: id } : { _id: id, ownerId: user._id };
}

async function create(req, res) {
  const heroData = { ...databasePayload(req.heroPayload), ownerId: req.user._id };
  const image = req.files?.image || req.files?.Image;

  if (image) {
    if (!ALLOWED_IMAGE_TYPES.has(image.mimetype)) {
      return res.status(415).json({
        error: { code: "UNSUPPORTED_IMAGE", message: "Use JPEG, PNG, WebP or GIF" },
      });
    }
    heroData.Image = { data: image.data, contentType: image.mimetype };
  }

  const hero = await Hero.create(heroData);
  res.status(201).location(`/api/v1/heroes/${hero.id}`).json({ data: serialize(hero, req.user._id) });
}

async function list(req, res) {
  const page = positiveInteger(req.query.page, 1);
  const limit = positiveInteger(req.query.limit, 20, 100);
  const filter = req.query.search
    ? { Name: { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
    : {};
  const [heroes, total] = await Promise.all([
    Hero.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Hero.countDocuments(filter),
  ]);

  res.json({ data: heroes.map(serialize), meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function getOne(req, res) {
  const hero = await Hero.findById(req.params.id).lean();
  if (!hero) return res.status(404).json({ error: { code: "HERO_NOT_FOUND", message: "Hero not found" } });
  res.json({ data: serialize(hero) });
}

async function listMine(req, res) {
  const page = positiveInteger(req.query.page, 1);
  const limit = positiveInteger(req.query.limit, 20, 100);
  const filter = { ownerId: req.user._id };
  const [heroes, total] = await Promise.all([
    Hero.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Hero.countDocuments(filter),
  ]);

  res.json({
    data: heroes.map((hero) => serialize(hero, req.user._id)),
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

async function listLegacy(req, res) {
  const heroes = await Hero.find().sort({ _id: 1 }).lean();
  res.json(heroes.map(serializeLegacy));
}

async function getOneLegacy(req, res) {
  const hero = await Hero.findById(req.params.id).lean();
  if (!hero) return res.status(404).json({ message: "Hero not found" });
  res.json(serializeLegacy(hero));
}

async function update(req, res) {
  const filter = ownershipFilter(req.params.id, req.user);
  const hero = await Hero.findOneAndUpdate(filter, databasePayload(req.heroPayload), {
    new: true,
    runValidators: true,
  });
  if (!hero) return res.status(404).json({ error: { code: "HERO_NOT_FOUND", message: "Hero not found" } });
  res.json({ data: serialize(hero, req.user._id) });
}

async function remove(req, res) {
  const filter = ownershipFilter(req.params.id, req.user);
  const hero = await Hero.findOneAndDelete(filter);
  if (!hero) return res.status(404).json({ error: { code: "HERO_NOT_FOUND", message: "Hero not found" } });
  res.status(204).send();
}

async function uploadImage(req, res) {
  const image = req.files?.image || req.files?.Image;
  if (!image) return res.status(422).json({ error: { code: "IMAGE_REQUIRED", message: "An image file is required" } });
  if (!ALLOWED_IMAGE_TYPES.has(image.mimetype)) {
    return res.status(415).json({ error: { code: "UNSUPPORTED_IMAGE", message: "Use JPEG, PNG, WebP or GIF" } });
  }

  const filter = ownershipFilter(req.params.id, req.user);
  const hero = await Hero.findOneAndUpdate(filter, {
    Image: { data: image.data, contentType: image.mimetype },
  }, { new: true });
  if (!hero) return res.status(404).json({ error: { code: "HERO_NOT_FOUND", message: "Hero not found" } });
  res.json({ data: serialize(hero, req.user._id) });
}

async function getImage(req, res) {
  const hero = await Hero.findById(req.params.id).select("+Image.data").lean();
  if (!hero?.Image?.data) return res.status(404).json({ error: { code: "IMAGE_NOT_FOUND", message: "Image not found" } });
  const imageData = Buffer.isBuffer(hero.Image.data)
    ? hero.Image.data
    : Buffer.from(hero.Image.data.buffer);
  res.set({ "Content-Type": hero.Image.contentType, "Cache-Control": "public, max-age=86400" });
  res.end(imageData);
}

module.exports = {
  create,
  list,
  getOne,
  listMine,
  update,
  remove,
  uploadImage,
  getImage,
  listLegacy,
  getOneLegacy,
  serialize,
  ownershipFilter,
};
