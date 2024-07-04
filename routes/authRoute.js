import express from "express";
import bcrypt from "bcrypt";
import { db } from "../database.js";
import { HttpError } from "../middlewares/upload.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
const { JWT_SECRET } = process.env;

export const userRouter = express.Router();
//register user
userRouter.post("/signup", async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(HttpError(404, "Field is required"));
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  db.get("SELECT * FROM users WHERE Email = ?", [email], (err, user) => {
    if (err) {
      return next(HttpError(500, "Error retrieving data"));
    }
    if (user) {
      return next(HttpError(401, "Email already in use!"));
    }
    db.run(
      `INSERT INTO users (Username, Email, Password) VALUES (?, ?, ?)`,
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          return next(HttpError(500, err.message));
        }
        const token = jwt.sign({ id: this.lastID }, JWT_SECRET, {
          expiresIn: "48H",
        });
        console.log(token);

        res.status(201).send(token);
      }
    );
  });
});

//sign in user
userRouter.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(HttpError(404, "Field is required"));
  }
  db.get("SELECT * FROM users WHERE Email = ?", [email], (err, user) => {
    if (err) {
      return next(HttpError(500, "Error retrieving data"));
    }
    if (!user) {
      return next(HttpError(401, "Email or password is wrong!"));
    }
    const comparePassword = bcrypt.compare(password, user.Password);
    console.log(comparePassword);

    if (!comparePassword) {
      return next(HttpError(401, "Email or password is wrong!"));
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "48h",
    });
    res.status(201).json({ token });
  });
});

//current user
userRouter.get("/current", (req, res, next) => {
  console.log(req.headers);
  const { authorization } = req.headers;
  if (!authorization) {
    return next(HttpError(401, "Not authorized!"));
  }
  const token = authorization?.split(" ")[1];
  if (!token) {
    return next(HttpError(401, "No token!"));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get(
      `SELECT Id, Username, Email, Created_at FROM users WHERE Id = ?`,
      [decoded.id],
      (err, user) => {
        if (err) {
          return next(HttpError(500, err.message));
        }
        res.status(200).json(user);
      }
    );
  } catch (err) {
    return next(HttpError(401, "Invalid token!"));
  }
});

// user log out
//userRouter.post("/logout", (req, res, next) => {});
