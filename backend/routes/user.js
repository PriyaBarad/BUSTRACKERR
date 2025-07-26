// // const express = require('express');
// // const router = express.Router();
// // const User = require('../models/User');

// // router.post('/register', async (req, res) => {
// //   const { name, phone, password } = req.body;

// //   if (!name || !phone || !password) {
// //     return res.status(400).json({ message: 'All fields are required' });
// //   }

// //   try {
// //     // Check if user already exists
// //     const existingUser = await User.findOne({ phone });
// //     if (existingUser) {
// //       return res.status(409).json({ message: 'User already exists' });
// //     }

// //     // Save new user
// //     const newUser = new User({ name, phone, password });
// //     await newUser.save();

// //     res.status(201).json({ message: 'User registered and stored in DB' });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // });

// // module.exports = router;




// // const express = require('express');
// // const router = express.Router();

// // // Example route for user registration
// // router.post('/register', (req, res) => {
// //   const { name, phone, password } = req.body;

// //   // Simple validation (you can add DB logic later)
// //   if (!name || !phone || !password) {
// //     return res.status(400).json({ message: 'All fields are required' });
// //   }

// //   // Respond with success (mock)
// //   res.status(201).json({
// //     message: 'User registered successfully',
// //     data: {
// //       name,
// //       phone,
// //     },
// //   });
// // });

// // module.exports = router;


// // const express = require('express');
// // const router = express.Router();
// // const User = require('../models/User');

// // router.post('/register', async (req, res) => {
// //   try {
// //     const { fullName, phoneNumber, password } = req.body;
// //     const newUser = new User({ fullName, phoneNumber, password });
// //     await newUser.save();
// //     res.json({ message: "User registered successfully" });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: "Registration failed" });
// //   }
// // });

// // module.exports = router;




// // backend/routes/user.js
// const express = require('express');
// const router = express.Router();
// const { registerUser, loginUser } = require('../controller/userController');

// // Register route
// router.post('/register', registerUser);

// // ✅ Add Login route
// router.post('/login', loginUser);

// module.exports = router;



// // backend/routes/user.js
// const express = require('express');
// const router = express.Router();
// const { registerUser, loginUser } = require('../controller/userController');

// // Register route
// router.post('/register', registerUser);

// // ✅ Add Login route
// router.post('/login', loginUser);

// module.exports = router;



const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Register Route
router.post('/register', async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = new User({ name, phone, password });
    await newUser.save();

    console.log('✅ User saved to MongoDB:', newUser);
    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Login Route
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Export router
module.exports = router;

