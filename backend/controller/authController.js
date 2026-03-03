const bcrypt = require("bcrypt");
const User = require("../models/User");

exports.loginUser = async (req, res) => {
  const { phone, password } = req.body;

  try {
    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "Invalid phone number or password" });
    }

    // Compare given password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid phone number or password" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
