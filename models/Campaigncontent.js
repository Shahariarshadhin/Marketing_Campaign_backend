const mongoose = require('mongoose');

const mediaItemSchema = new mongoose.Schema({
  url:          { type: String, required: true },
  publicId:     { type: String, required: true }, // cloudinary public_id for deletion
  type:         { type: String, enum: ['image', 'video'], required: true },
  originalName: { type: String, default: '' },
  size:         { type: Number, default: 0 },
}, { _id: true, timestamps: true });

const campaignContentSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    unique: true  // one content page per campaign
  },
  youtubeUrl:   { type: String, default: '' },
  facebookUrl:  { type: String, default: '' },
  description:  { type: String, default: '' },
  media:        [mediaItemSchema],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CampaignContent', campaignContentSchema);