const bcrypt = require("bcrypt");
const User = require("../models/User");

// exports.registerUser = async (req, res) => {
//   const {name, phone, password } = req.body;

//   try {
//     // Check if phone already exists
//     const existingUser = await User.findOne({ phone });
//     if (existingUser) {
//       return res.status(400).json({ message: "Phone number already registered" });
//     }

//     // Hash password before saving
//     // const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       name,
//       phone,
//       password: hashedPassword,
//     });

//     await newUser.save();

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error("Register error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };



exports.registerUser = async (req, res) => {
  console.log("Request body:", req.body);
  const { name, phone, password } = req.body;
  try {
    const existingUser = await User.findOne({ phone });
    console.log("Existing user:", existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, phone, password: hashedPassword });
    const savedUser = await newUser.save();
    console.log("Saved user:", savedUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
