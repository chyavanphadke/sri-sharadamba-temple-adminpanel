const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: String, default: 'User' },
  approved: { type: Boolean, default: false },
  reason_for_access: { type: String, required: true },
});

module.exports = mongoose.model('User', UserSchema);
