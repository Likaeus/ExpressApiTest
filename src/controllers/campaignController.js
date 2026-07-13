const Campaign = require("../models/Campaign");
const config = require("../config");

function binaryBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value?.buffer) return Buffer.from(value.buffer);
  if (typeof value?.value === "function") return Buffer.from(value.value());
  return Buffer.from(value);
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100) || "campaign";
}

function serialize(campaign, currentUserId) {
  const value = campaign.toObject ? campaign.toObject() : campaign;
  const isOwner = Boolean(currentUserId && value.ownerId?.toString() === currentUserId.toString());
  return {
    id: value._id, name: value.name, slug: value.slug,
    creatorName: value.creatorName || "Comunidad del enclave",
    shortDescription: value.shortDescription, description: value.description,
    system: value.system, genres: value.genres, tone: value.tone,
    status: value.status, visibility: value.visibility,
    playerCount: value.playerCount, schedule: value.schedule,
    contentWarnings: value.contentWarnings, map: value.map,
    mapPreviewUrl: value.mapAssets?.preview?.contentType ? `/api/v1/campaigns/${value._id}/map/preview${value.visibility === "public" ? "" : isOwner ? "/mine" : ""}` : null,
    isOwnedByCurrentUser: isOwner,
    createdAt: value.createdAt, updatedAt: value.updatedAt, publishedAt: value.publishedAt,
  };
}

const positiveInteger = (value, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
};
const ownershipFilter = (id, user) => user.role === "admin" ? { _id: id } : { _id: id, ownerId: user._id };

async function uniqueSlug(name, ownerId, ignoredId) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await Campaign.exists({ ownerId, slug, ...(ignoredId ? { _id: { $ne: ignoredId } } : {}) })) slug = `${base}-${suffix++}`;
  return slug;
}

async function list(req, res) {
  const page = positiveInteger(req.query.page, 1);
  const limit = positiveInteger(req.query.limit, 12, 50);
  const filter = { visibility: "public" };
  if (req.query.system) filter.system = String(req.query.system);
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.search) {
    const search = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["name", "shortDescription", "description"].map((field) => ({ [field]: { $regex: search, $options: "i" } }));
  }
  const [campaigns, total] = await Promise.all([
    Campaign.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Campaign.countDocuments(filter),
  ]);
  res.json({ data: campaigns.map(serialize), meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function listMine(req, res) {
  const campaigns = await Campaign.find({ ownerId: req.user._id }).sort({ updatedAt: -1 }).limit(100).lean();
  res.json({ data: campaigns.map((item) => serialize(item, req.user._id)), meta: { total: campaigns.length } });
}

async function create(req, res) {
  const payload = req.campaignPayload;
  const campaign = await Campaign.create({
    ...payload, ownerId: req.user._id, creatorName: req.user.name,
    slug: await uniqueSlug(payload.name, req.user._id),
    publishedAt: payload.visibility === "public" ? new Date() : null,
  });
  res.status(201).location(`/api/v1/campaigns/${campaign.id}`).json({ data: serialize(campaign, req.user._id) });
}

async function getOne(req, res) {
  const campaign = await Campaign.findById(req.params.id).lean();
  if (!campaign || campaign.visibility !== "public") return res.status(404).json({ error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" } });
  res.json({ data: serialize(campaign) });
}

async function update(req, res) {
  const existing = await Campaign.findOne(ownershipFilter(req.params.id, req.user));
  if (!existing) return res.status(404).json({ error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" } });
  const payload = req.campaignPayload;
  const wasPublished = existing.visibility === "public";
  Object.assign(existing, payload, {
    slug: await uniqueSlug(payload.name, existing.ownerId, existing._id),
    publishedAt: payload.visibility === "public" ? existing.publishedAt || new Date() : wasPublished ? existing.publishedAt : null,
  });
  await existing.save();
  res.json({ data: serialize(existing, req.user._id) });
}

async function remove(req, res) {
  const campaign = await Campaign.findOneAndDelete(ownershipFilter(req.params.id, req.user));
  if (!campaign) return res.status(404).json({ error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" } });
  res.status(204).send();
}

async function uploadMap(req, res) {
  const preview = req.files?.preview;
  const source = req.files?.source;
  if (!preview || !source) return res.status(422).json({ error: { code: "MAP_FILES_REQUIRED", message: "Map preview and source are required" } });
  if (preview.size > config.maxMapSize || source.size > config.maxMapSize || preview.size + source.size > config.maxMapUploadSize) return res.status(413).json({ error: { code: "MAP_TOO_LARGE", message: "Map files exceed the Netlify upload limit" } });
  const svg = preview.data.toString("utf8");
  if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(svg) || /<script[\s>]|\son\w+\s*=|javascript:/i.test(svg)) {
    return res.status(415).json({ error: { code: "INVALID_MAP_PREVIEW", message: "Map preview must be a safe SVG" } });
  }
  const campaign = await Campaign.findOneAndUpdate(ownershipFilter(req.params.id, req.user), {
    mapAssets: {
      preview: { data: preview.data, contentType: "image/svg+xml" },
      source: { data: source.data, contentType: "text/plain" },
    },
  }, { new: true });
  if (!campaign) return res.status(404).json({ error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" } });
  res.json({ data: serialize(campaign, req.user._id) });
}

async function getMapPreview(req, res) {
  const campaign = await Campaign.findOne({ _id: req.params.id, visibility: "public" }).select("+mapAssets.preview.data").lean();
  if (!campaign?.mapAssets?.preview?.data) return res.status(404).json({ error: { code: "MAP_NOT_FOUND", message: "Map preview not found" } });
  res.set({ "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600", "Cross-Origin-Resource-Policy": "cross-origin", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src data:" });
  res.end(binaryBuffer(campaign.mapAssets.preview.data));
}

async function getOwnedMapPreview(req, res) {
  const campaign = await Campaign.findOne(ownershipFilter(req.params.id, req.user)).select("+mapAssets.preview.data").lean();
  if (!campaign?.mapAssets?.preview?.data) return res.status(404).json({ error: { code: "MAP_NOT_FOUND", message: "Map preview not found" } });
  res.set({ "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=300", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src data:" });
  res.end(binaryBuffer(campaign.mapAssets.preview.data));
}

module.exports = { list, listMine, create, getOne, update, remove, uploadMap, getMapPreview, getOwnedMapPreview, serialize, ownershipFilter, slugify };
