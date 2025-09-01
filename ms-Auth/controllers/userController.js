import pool from "../db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";



const generateAccessToken = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "12m",
  });
  return accessToken;
};

// JWT middleware to verify token

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ msg: "Access token required" });
  }

  const token = authHeader.split(" ")[1]; // Remove "Bearer"

  if (!token) {
    return res.status(401).json({ msg: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};

const token_refresh = async (req, res) => {
  const refreshToken =
    (req.body && req.body.refreshToken) ||
    (req.cookies && req.cookies.refreshToken) ||
    req.headers["x-refresh-token"];

  if (refreshToken == null) {
    res.sendStatus(401);
  }

  try {
    const tokenData = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    );
    if (tokenData.rows.length === 0 || tokenData.rows[0].revoked) {
      return res
        .status(403)
        .json({ msg: "Refresh token is invalid or revoked" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const payload = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
    const accessToken = generateAccessToken(payload);
    console.log(accessToken)
    res.json({ accessToken: accessToken });
  } catch (error) {
    res.status(403).json({ msg: "Token expired or invalid", error: error });
  }
};

const get_users = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

const register = async (req, res) => {
  try {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const confirmPwd = req.body.confirm;
    const role = req.body.role;

    console.log(email + username + role);
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ msg: "email already exists" });
    }

    if (password != confirmPwd) {
      res.status(400).json({ msg: "password not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
    INSERT INTO users (email , username, password, role)
    VALUES ($1, $2, $3 , $4)
    RETURNING id,email , username, role;
  `;
    const values = [email, username, hashedPassword, role];

    const result = await pool.query(query, values);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json({ msg: error });
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length === 0) {
      return res.status(401).json({ msg: "Incorrect email or password" });
    }
    const user = existingUser.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ msg: "Incorrect email or password" });
    }
    if(user.role != role){
        return res.status(403).json({ msg: "Invalid role" });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    const token = generateAccessToken(payload);
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
    const expiresAt = dayjs().add(7, "days").toDate();
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, expiresAt]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log({ accessToken: token, refreshToken: refreshToken });

    res.status(200).json({
      accessToken: token,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json(error);
  }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const handleGoogleAuth = async (req, res) => {
  const { idToken } = req.body;
  const role = req.body.role;
  console.log(role);
  try {
    // 1. Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: id, email, name: username } = ticket.getPayload();

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    var hashedPassword = "";
    if (existingUser.rows.length > 0) {
      hashedPassword = existingUser.rows[0].password;
        if(existingUser.rows[0].role !== role){
            return res.status(403).json({ msg: "Invalid role" });
        }
    } else {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      hashedPassword = await bcrypt.hash(randomPassword, 10);
    }

    // 2. Upsert user in your db
    const { rows } = await pool.query(
      `INSERT INTO users (email, username, role, password)
         VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET username = EXCLUDED.username
       RETURNING id, email, username, role;`,
      [email, username, role , hashedPassword]
    );
    const user = rows[0];
    console.log(user);
    // 3. Issue access & refresh tokens (reuse your helpers)
    const payload = { id: user.id, username: user.username, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
    const expiresAt = dayjs().add(7, "days").toDate();
    console.log(accessToken);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)",
      [user.id, refreshToken, expiresAt]
    );
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: "Google auth failed" });
  }
};

const handleFacebookAuth = async (req, res) => {
  const { fbToken , role } = req.body;

  try {
    // 1. Validate the Facebook token
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token` +
        `?input_token=${fbToken}` +
        `&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
    );
    const { data } = await debugRes.json();
    if (!data.is_valid) {
      return res.status(401).json({ msg: "Invalid Facebook token" });
    }

    // 2. Fetch user profile from Facebook
    const profileRes = await fetch(
      `https://graph.facebook.com/${data.user_id}` +
        `?fields=id,name,email` +
        `&access_token=${fbToken}`
    );
    const profile = await profileRes.json();
    const { email, name: username } = profile;

      var hashedPassword = "";
      const existingUser = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
      );

      var hashedPassword = "";
      if (existingUser.rows.length > 0) {
          hashedPassword = existingUser.rows[0].password;
          if(existingUser.rows[0].role !== role){
              return res.status(403).json({ msg: "Invalid role" });
          }
      } else {
          const randomPassword = crypto.randomBytes(16).toString("hex");
          hashedPassword = await bcrypt.hash(randomPassword, 10);
      }

    // 3. Upsert the user with a dummy password
    const { rows } = await pool.query(
      `INSERT INTO users (email, username, role, password)
         VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET username = EXCLUDED.username
       RETURNING id, email, username, role;`,
      [email, username,role, hashedPassword]
    );
    const user = rows[0];

    // 4. Issue your own JWTs and store the refresh token
    const payload = { id: user.id, username: user.username, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
    const expiresAt = dayjs().add(7, "days").toDate();

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, expiresAt]
    );

    // 5. Send tokens back (and set HTTP‑only cookie for refreshToken)
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Facebook auth failed" });
  }
};

const profile = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email , username, role, profile_image_url FROM users WHERE id = $1",
      [req.user.id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
};

const logout = async (req, res) => {
  // Get refresh token from header or body  or cookie
  const refreshToken =
    (req.body && req.body.refreshToken) ||
    req.headers["x-refresh-token"] ||
    (req.cookies && req.cookies.refreshToken);

  if (!refreshToken) {
    return res.status(400).json({ msg: "No refresh token provided" });
  }

  await pool.query(
    "UPDATE refresh_tokens SET revoked = true WHERE token = $1",
    [refreshToken]
  );

  res.status(200).json({ msg: "Logged out successfully" });
};

const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

      // ✅ Get current user's previous image (if any)
      const { rows } = await pool.query(
          "SELECT profile_image_url FROM users WHERE id = $1",
          [req.user.id]
      );

      const previousImage = rows[0]?.profile_image_url;

      // ✅ Delete the previous image file if it exists
      if (previousImage) {
        const oldImagePath = path.join(process.cwd(), previousImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // delete file
        }
      }

        // Build the public URL or path
        const newImageUrl = `/uploads/${req.file.filename}`;

        // Persist to the user record
        await pool.query(
            'UPDATE users SET profile_image_url = $1 WHERE id = $2',
            [newImageUrl, req.user.id]
        );

        // Optionally return the updated user row
        const updated = await pool.query(
            'SELECT id, email, username, role, profile_image_url FROM users WHERE id = $1',
            [req.user.id]
        );

        res.status(200).json({ user: updated.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed', error: err });
    }
};


export default {
  token_refresh,
  get_users,
  register,
  login,
    uploadProfileImage,
  profile,
  handleGoogleAuth,
  handleFacebookAuth,
  logout,
};
