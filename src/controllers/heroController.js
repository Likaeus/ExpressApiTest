const Hero = require("../../Models/HeroCardModel");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function serialize(hero) {
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

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? Math.min(number, maximum) : fallback;
}

async function create(req, res) {
  const heroData = databasePayload(req.heroPayload);
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
  res.status(201).location(`/api/v1/heroes/${hero.id}`).json({ data: serialize(hero) });
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

async function update(req, res) {
  const hero = await Hero.findByIdAndUpdate(req.params.id, databasePayload(req.heroPayload), {
    new: true,
    runValidators: true,
  });
  if (!hero) return res.status(404).json({ error: { code: "HERO_NOT_FOUND", message: "Hero not found" } });
  res.json({ data: serialize(hero) });
}

async function remove(req, res) {
  const hero = await Hero.findByIdAndDelete(req.params.id);
  if (!hero) return res.status(404).json({ error: { code: "HERO_NOT_FOUND", message: "Hero not found" } });
  res.status(204).send();
}

async function uploadImage(req, res) {
  const image = req.files?.image || req.files?.Image;
  if (!image) return res.status(422).json({ error: { code: "IMAGE_REQUIRED", message: "An image file is required" } });
  if (!ALLOWED_IMAGE_TYPES.has(image.mimetype)) {
    return res.status(415).json({ error: { code: "UNSUPPORTED_IMAGE", message: "Use JPEG, PNG, WebP or GIF" } });
  }

  const hero = await Hero.findByIdAndUpdate(req.params.id, {
    Image: { data: image.data, contentType: image.mimetype },
  }, { new: true });
  if (!hero) return res.status(404).json({ error: { code: "HERO_NOT_FOUND", message: "Hero not found" } });
  res.json({ data: serialize(hero) });
}

async function getImage(req, res) {
  const hero = await Hero.findById(req.params.id).select("+Image.data").lean();
  if (!hero?.Image?.data) return res.status(404).json({ error: { code: "IMAGE_NOT_FOUND", message: "Image not found" } });
  res.set({ "Content-Type": hero.Image.contentType, "Cache-Control": "public, max-age=86400" });
  res.send(hero.Image.data);
}

module.exports = { create, list, getOne, update, remove, uploadImage, getImage, serialize };
