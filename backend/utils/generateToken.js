// utils/generateToken.js
// Creates and signs a JSON Web Token (JWT) for a given user ID.
//
// How JWT works (for your professor demo):
//   A JWT has 3 parts separated by dots:  HEADER.PAYLOAD.SIGNATURE
//   - Header:    algorithm used (HS256)
//   - Payload:   data we embed — here, the user's MongoDB _id
//   - Signature: HMAC-SHA256 of header+payload using JWT_SECRET from .env
//
//   The server never stores the token. On each request, it re-verifies
//   the signature to confirm the token hasn't been tampered with.

const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for a user.
 * @param {string} id - The MongoDB _id of the user (ObjectId as string)
 * @param {"student" | "admin"} role - The current role stored in MongoDB
 * @returns {string} A signed JWT string
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },                     // Role is checked against MongoDB on protected requests
    process.env.JWT_SECRET,           // Secret key from .env — never hardcoded
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } // Token lifetime
  );
};

module.exports = generateToken;
