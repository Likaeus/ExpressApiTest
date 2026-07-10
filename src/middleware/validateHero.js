function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHeroPayload(body = {}) {
  let details = body.details ?? body.Details ?? {};
  if (typeof details === "string") {
    try { details = JSON.parse(details); } catch { details = {}; }
  }

  return {
    name: text(body.name ?? body.Name),
    description: text(body.description ?? body.Description),
    details: {
      powers: text(details.powers ?? details.Powers ?? body.powers ?? body.Powers),
      weakness: text(details.weakness ?? details.Weakness ?? body.weakness ?? body.Weakness),
    },
  };
}

function validateHero(req, res, next) {
  const hero = normalizeHeroPayload(req.body);
  const missing = [];
  if (!hero.name) missing.push("name");
  if (!hero.description) missing.push("description");
  if (!hero.details.powers) missing.push("details.powers");
  if (!hero.details.weakness) missing.push("details.weakness");

  if (missing.length) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: `Required fields: ${missing.join(", ")}`,
      },
    });
  }

  req.heroPayload = hero;
  next();
}

module.exports = { normalizeHeroPayload, validateHero };
