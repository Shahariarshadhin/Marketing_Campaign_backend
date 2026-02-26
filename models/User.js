const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Default campaign fields that can be toggled per viewer
const DEFAULT_VISIBLE_FIELDS = [
  'name', 'delivery', 'status', 'actions', 'results',
  'costPerResult', 'budget', 'amountSpent', 'impressions',
  'reach', 'endDate', 'active'
];

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['admin', 'viewer'], default: 'viewer' },

  // Which campaigns this viewer can see
  allowedCampaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],

  // If true, viewer sees ALL campaigns from here
  viewAllCampaigns: { type: Boolean, default: false },

  // Which fields/columns are visible to this viewer
  visibleFields: {
    type: [String],
    default: DEFAULT_VISIBLE_FIELDS
  },

  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
module.exports.DEFAULT_VISIBLE_FIELDS = DEFAULT_VISIBLE_FIELDS;