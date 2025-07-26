// const User = require('../models/User');
// const bcrypt = require('bcryptjs');

// exports.registerUser = async (req, res) => {
//   const { fullName, phone, password } = req.body;

//   try {
//     const userExists = await User.findOne({ phone });
//     if (userExists) return res.status(400).json({ message: 'User already exists' });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ fullName, phone, password: hashedPassword });
//     await newUser.save();

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


const User = require('../models/User'); // make sure this path is correct

// exports.loginUser = async (req, res) => {
//   const { phone, password } = req.body;
//   console.log("📥 Login attempt:", phone, password);

//   try {
//     const user = await User.findOne({ phone });

//     if (!user) {
//       console.log("❌ User not found");
//       return res.status(401).json({ message: "User not found" });
//     }

//     if (user.password !== password) {
//       console.log("❌ Incorrect password");
//       return res.status(401).json({ message: "Incorrect password" });
//     }

//     console.log("✅ Login success");
//     return res.status(200).json({ message: "Login successful", user });
//   } catch (error) {
//     console.error("💥 Login error:", error.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

exports.loginUser = async (req, res) => {
  const { phone, password } = req.body;

  console.log("Login attempt:", phone, password); // log for debugging

  try {
    const user = await User.findOne({ phone, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

