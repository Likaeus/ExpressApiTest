const STATUSES = new Set(["planning", "active", "paused", "completed"]);
const VISIBILITIES = new Set(["public", "unlisted", "private"]);
const SIZES = new Set(["small", "medium", "large"]);
const LANDFORMS = new Set(["continents", "archipelago", "islands", "pangea"]);
const CLIMATES = new Set(["temperate", "cold", "arid", "tropical"]);

const text = (value) => typeof value === "string" ? value.trim() : "";
const list = (value, maximum) => Array.isArray(value)
  ? value.map(text).filter(Boolean).slice(0, maximum)
  : [];

function number(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function normalizeCampaignPayload(body = {}) {
  const map = body.map && typeof body.map === "object" ? body.map : {};
  const parameters = map.parameters && typeof map.parameters === "object" ? map.parameters : {};
  const players = body.playerCount && typeof body.playerCount === "object" ? body.playerCount : {};
  return {
    name: text(body.name),
    shortDescription: text(body.shortDescription),
    description: text(body.description),
    system: text(body.system),
    genres: list(body.genres, 6),
    tone: text(body.tone),
    status: text(body.status) || "planning",
    visibility: text(body.visibility) || "private",
    playerCount: { min: number(players.min, 1), max: number(players.max, 5) },
    schedule: text(body.schedule),
    contentWarnings: list(body.contentWarnings, 10),
    map: {
      provider: map.provider === "azgaar" ? "azgaar" : "seed-preview",
      seed: text(map.seed),
      generatorVersion: text(map.generatorVersion) || "epic-preview-1",
      parameters: {
        size: text(parameters.size) || "medium",
        landform: text(parameters.landform) || "continents",
        climate: text(parameters.climate) || "temperate",
      },
    },
  };
}

function validateCampaign(req, res, next) {
  const campaign = normalizeCampaignPayload(req.body);
  const missing = ["name", "shortDescription", "description", "system", "tone"]
    .filter((field) => !campaign[field]);
  if (!campaign.map.seed) missing.push("map.seed");
  const invalid = [];
  if (!STATUSES.has(campaign.status)) invalid.push("status");
  if (!VISIBILITIES.has(campaign.visibility)) invalid.push("visibility");
  if (!SIZES.has(campaign.map.parameters.size)) invalid.push("map.parameters.size");
  if (!LANDFORMS.has(campaign.map.parameters.landform)) invalid.push("map.parameters.landform");
  if (!CLIMATES.has(campaign.map.parameters.climate)) invalid.push("map.parameters.climate");
  if (campaign.playerCount.min < 1 || campaign.playerCount.max > 20 || campaign.playerCount.min > campaign.playerCount.max) {
    invalid.push("playerCount");
  }
  if (missing.length || invalid.length) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: [missing.length && `Required fields: ${missing.join(", ")}`, invalid.length && `Invalid fields: ${invalid.join(", ")}`].filter(Boolean).join(". "),
      },
    });
  }
  req.campaignPayload = campaign;
  next();
}

module.exports = { normalizeCampaignPayload, validateCampaign };
