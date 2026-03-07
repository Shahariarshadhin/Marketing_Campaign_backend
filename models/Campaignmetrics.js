const mongoose = require('mongoose');

// Daily metrics snapshot for a campaign
const campaignMetricsSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Standard fields
  results:       { type: String, default: '—' },
  costPerResult: { type: String, default: '—' },
  budget:        { type: String, default: '—' },
  amountSpent:   { type: String, default: '—' },
  impressions:   { type: String, default: '—' },
  reach:         { type: String, default: '—' },
  actions:       { type: String, default: '—' },
  delivery:      { type: String, default: '—' },
  // Custom fields data for that day
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Unique per campaign per date
campaignMetricsSchema.index({ campaign: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CampaignMetrics', campaignMetricsSchema);