import express from "express";
import promisify from "util.promisify";
import bcrypt from "bcrypt";
import { db } from "../database.js";
import { HttpError } from "../middlewares/upload.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
const { JWT_SECRET } = process.env;

export const userRouter = express.Router();

// have used lib util.promisify for use try/catch for asinc fn
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

//register user
userRouter.post("/signup", async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(HttpError(404, "Field is required"));
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await dbGet("SELECT * FROM users WHERE Email = ?", [email]);
    if (user) {
      return next(HttpError(401, "Email already in use!"));
    }
    await dbRun(
      `INSERT INTO users (Username, Email, Password) VALUES (?, ?, ?)`,
      [name, email, hashedPassword]
    );
    res.status(201).send({ user: { name, email } });
  } catch (error) {
    return next(HttpError(500, error.message));
  }
});

//sign in user
userRouter.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(HttpError(404, "Field is required"));
  }
  try {
    const user = await dbGet("SELECT * FROM users WHERE Email = ?", [email]);
    if (!user) {
      return next(HttpError(401, "Email or password is wrong!"));
    }
    const comparePassword = await bcrypt.compare(password, user.Password);
    if (!comparePassword) {
      return next(HttpError(401, "Email or password is wrong!"));
    }
    const token = jwt.sign({ id: user.Id }, JWT_SECRET, {
      expiresIn: "48h",
    });
    res
      .status(201)
      .json({ token, user: { name: user.Username, email: user.Email } });
  } catch (error) {
    return next(HttpError(500, error.message));
  }
});

//current user
userRouter.get("/current", async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return next(HttpError(401, "Not authorized!"));
  }
  const token = authorization?.split(" ")[1];
  if (!token) {
    return next(HttpError(401, "No token!"));
  }
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await dbGet(
      `SELECT Id, Username, Email, Created_at FROM users WHERE Id = ?`,
      [id]
    );
    res.status(200).json({ user: { name: user.Username, email: user.Email } });
  } catch (error) {
    return next(HttpError(401, "Invalid token!"));
  }
});

// user log out
//userRouter.post("/logout", (req, res, next) => {});
