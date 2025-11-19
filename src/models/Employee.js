const mongoose = require('mongoose');

const dailyWorkSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
});

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dailyWork: [dailyWorkSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who created
});

module.exports = mongoose.model('Employee', employeeSchema);
