const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { generateToken } = require("../service/auth");

const router = express.Router();

router.get("/signup", (req, res) => {
  return res.render("signup");
});
router.get("/login", (req, res) => {
  return res.render("login");
});

router.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;

  let existingUser = await User.findOne({ email });
  if (existingUser)
    return res.render("signup", { error: "Email already exist" });

  let hashPassword = await bcrypt.hash(password, 7);
  let user = await User.create({
    name,
    email,
    password: hashPassword,
  });

  return res.redirect("/");
});

router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await User.findOne({ email });
  if (!user) return res.render("login", { error: "User Not Found" });

  let hashedPassword = await bcrypt.compare(password, user.password)
  if(!hashedPassword) return res.render("login", { error: "Incorrect Password" });

  let token = generateToken(user)
  res.cookie("token", token, {
  httpOnly: true,   // JS can't access cookie (protection against XSS)
  sameSite: "strict"
})
  return res.redirect("/");
});
router.get("/logout", async (req, res) => {
  res.clearCookie("token")
  res.redirect("/")
});

module.exports = router;
