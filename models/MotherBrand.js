const mongoose = require('mongoose');

const motherBrandSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  logo:        { type: String, default: '' },   // Cloudinary URL
  color:       { type: String, default: '#6366f1' }, // brand accent color
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('MotherBrand', motherBrandSchema);