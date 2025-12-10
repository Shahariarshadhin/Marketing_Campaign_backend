// models/Campaign.js
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'scheduled', 'paused', 'completed'],
    default: 'draft'
  },
  delivery: { 
    type: String,
    default: 'In draft'
  },
  actions: { 
    type: String,
    default: ''
  },
  results: { 
    type: String,
    default: '—'
  },
  costPerResult: { 
    type: String,
    default: '—'
  },
  budget: { 
    type: String,
    default: 'Using ad set budget'
  },
  amountSpent: { 
    type: String,
    default: '$0.00'
  },
  impressions: { 
    type: String,
    default: '—'
  },
  reach: { 
    type: String,
    default: '—'
  },
  endDate: { 
    type: String,
    default: 'Ongoing'
  },
  active: { 
    type: Boolean, 
    default: false 
  },
  objective: { 
    type: String,
    enum: ['awareness', 'traffic', 'engagement', 'leads', 'sales', 'app_promotion'],
    required: true
  },
  bidStrategy: { 
    type: String,
    enum: ['lowest_cost', 'cost_cap', 'bid_cap', 'highest_value'],
    default: 'lowest_cost'
  },
  dailyBudget: { 
    type: String,
    default: ''
  },
  lifetimeBudget: { 
    type: String,
    default: ''
  },
  startDate: { 
    type: String,
    default: ''
  },
  targetAudience: { 
    type: String,
    default: ''
  },
  placement: { 
    type: String,
    enum: ['automatic', 'manual', 'facebook_only', 'instagram_only'],
    default: 'automatic'
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);