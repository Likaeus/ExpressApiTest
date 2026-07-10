const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createAccessToken } = require("../services/tokenService");

const HASH_ROUNDS = 12;
const INVALID_LOGIN = { code: "INVALID_CREDENTIALS", message: "Invalid email or password" };
const DUMMY_PASSWORD_HASH = "$2b$12$k7hriV7ear33pBI8hYegguV7bhWA7NRUFMftm7Y/86gFaM.SBUNPW";

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register(req, res) {
  const { name, email, password } = req.registration;
  const existingUser = await User.exists({ email });
  if (existingUser) {
    return res.status(409).json({
      error: { code: "ACCOUNT_NOT_AVAILABLE", message: "An account cannot be created with these details" },
    });
  }

  const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);
  try {
    const user = await User.create({ name, email, passwordHash });
    const accessToken = createAccessToken(user);
    res.status(201).json({
      data: { user: publicUser(user), accessToken, tokenType: "Bearer", expiresIn: configExpiry() },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        error: { code: "ACCOUNT_NOT_AVAILABLE", message: "An account cannot be created with these details" },
      });
    }
    throw error;
  }
}

async function login(req, res) {
  const { email, password } = req.credentials;
  const user = await User.findOne({ email }).select("+passwordHash name email role isActive");
  const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
  const passwordMatches = await bcrypt.compare(password, passwordHash);

  if (!user?.isActive || !passwordMatches) {
    return res.status(401).json({ error: INVALID_LOGIN });
  }

  const accessToken = createAccessToken(user);
  res.json({
    data: { user: publicUser(user), accessToken, tokenType: "Bearer", expiresIn: configExpiry() },
  });
}

function me(req, res) {
  res.json({ data: { user: publicUser(req.user) } });
}

function configExpiry() {
  return process.env.JWT_EXPIRES_IN || "15m";
}

module.exports = { register, login, me, publicUser };
