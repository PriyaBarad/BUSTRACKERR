// backend/controllers/userController.js
// const User = require('../models/User');

// exports.registerUser = async (req, res) => {
//   console.log('📥 Received data from frontend:', req.body); // ✅ Debug

//   const { name, phone, password } = req.body;

//   try {
//     const newUser = new User({ name, phone, password });
//     await newUser.save();

//     console.log('✅ User saved to MongoDB:', newUser); // ✅ Debug

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     console.error('❌ Error saving user:', error); // ✅ Debug
//     res.status(500).json({ message: 'Registration failed', error });
//   }
// };



// const User = require('../models/User');

// exports.registerUser = async (req, res) => {
//   const { name, phone, password } = req.body;

//   try {
//     // ✅ Check if user already exists
//     const existingUser = await User.findOne({ phone, password });

//     if (existingUser) {
//       return res.status(400).json({ message: 'This user already exists' });
//     }

//     const newUser = new User({ name, phone, password });
//     await newUser.save();

//     console.log("✅ User saved to MongoDB:", newUser);
//     res.status(201).json({ message: 'User registered successfully' });

//   } catch (error) {
//     console.error('❌ Error saving user:', error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };



// exports.loginUser = async (req, res) => {
//   const { phone, password } = req.body;

//   try {
//     const user = await User.findOne({ phone, password });

//     if (!user) {
//       return res.status(401).json({ message: 'User not registered' });
//     }

//     res.status(200).json({ message: 'Login successful', user });
//   } catch (error) {
//     console.error('❌ Login error:', error);
//     res.status(500).json({ message: 'Login failed', error });
//   }
// };

const User = require('../models/User');

exports.registerUser = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    // ✅ Check if user already exists
    const existingUser = await User.findOne({ phone, password });

    if (existingUser) {
      return res.status(400).json({ message: 'This user already exists' });
    }

    const newUser = new User({ name, phone, password });
    await newUser.save();

    console.log("✅ User saved to MongoDB:", newUser);
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error('❌ Error saving user:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.loginUser = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone, password });

    if (!user) {
      return res.status(401).json({ message: 'User not registered' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Login failed', error });
  }
};