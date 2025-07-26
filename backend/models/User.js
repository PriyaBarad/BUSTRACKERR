// // const mongoose = require('mongoose');

// // const UserSchema = new mongoose.Schema({
// //   name: {
// //     type: String,
// //     required: true,
// //   },
// //   phone: {
// //     type: String,
// //     required: true,
// //     unique: true,
// //   },
// //   password: {
// //     type: String,
// //     required: true,
// //   },
// // });

// // module.exports = mongoose.model('User', UserSchema);


// // backend/models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// });

// // ✅ Add this line to make (name + phone + password) unique together
// // userSchema.index({ name: 1, phone: 1, password: 1 }, { unique: true });

// // Export the model
// module.exports = mongoose.model('User', userSchema);
// backend/models/User.js


// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// });


// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { collection: 'user' }); // 👈 force collection name

module.exports = mongoose.model('User', userSchema);
