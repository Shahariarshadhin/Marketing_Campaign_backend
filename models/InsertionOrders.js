const mongoose = require('mongoose');

const insertionOrderSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true,
  },
  name:        { type: String, required: true, trim: true },
  ioId:        { type: String, default: () => Math.floor(1000000000 + Math.random() * 9000000000).toString() },
  type:        { type: String, enum: ['standard', 'over_the_top', 'programmatic_guaranteed'], default: 'standard' },
  status:      { type: String, enum: ['active', 'draft', 'paused', 'completed'], default: 'draft' },
  pacing:      { type: String, enum: ['pacing', 'underpacing', 'at_risk'], default: 'pacing' },

  // Budget
  budget:      { type: Number, default: 0 },
  currency:    { type: String, default: 'USD' },
  amountSpent: { type: Number, default: 0 },

  // Goal / CPM
  goal:        { type: String, default: '' },    // e.g. "$0.01 CPM"
  goalType:    { type: String, enum: ['cpm', 'cpc', 'cpa', 'cpcv', 'viewability', 'none'], default: 'cpm' },
  goalValue:   { type: Number, default: 0 },

  // Delivery metrics
  impressions: { type: Number, default: 0 },
  revenue:     { type: Number, default: 0 },
  interactions:{ type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  cpa:         { type: Number, default: 0 },

  // Custom bidding
  customImprValue: { type: Number, default: 0 },

  // Schedule
  startDate:   { type: String, default: '' },
  endDate:     { type: String, default: '' },

  // Frequency cap
  frequencyCap:{ type: String, default: '' },

  notes:       { type: String, default: '' },
  active:      { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Inventory Source ──────────────────────────────────────────────────────
  inventorySource: {
    quality:             { type: String, default: 'Authorized Direct Sellers And Resellers' },
    // exchanges: array of { name, group, selected }
    exchanges:           [{ name: String, url: String, selected: { type: Boolean, default: true } }],
    targetNewExchanges:  { type: Boolean, default: true },
    deals:               { type: String, default: '0 deals and inventory packages selected' },
    dealGroups:          { type: String, default: 'No inventory groups selected' },
  },

  // ── Targeting ─────────────────────────────────────────────────────────────
  targeting: {
    brandSafety: {
      digitalContentLabels: [{ type: String }],   // e.g. ['DL-MA','Not yet labeled']
      sensitiveCategories:  [{ type: String }],   // e.g. ['Sensitive social issues',...]
    },
    environment:   [{ type: String }],             // e.g. ['Web','App']
    viewability: {
      openMeasurement: { type: Boolean, default: true },
      notes:           { type: String, default: '' },
    },
    geography:     [{ type: String }],
    language:      [{ type: String }],
    device:        [{ type: String }],
    audience:      [{ type: String }],
    keywords:      [{ type: String }],
    appsUrls: {
      channels:    [{ name: String, url: String }],
      collections: [{ name: String, url: String }],
      urls:        [{ value: String }],
      apps:        [{ name: String, publisher: String, platform: String, packageId: String, action: { type: String, default: 'include' } }],
    },
    additionalNotes: { type: String, default: '' },
  },

  // ── Creatives ─────────────────────────────────────────────────────────────
  creatives: [{
    name:           { type: String, required: true },
    cm360Id:        { type: String, default: '' },
    dv360Id:        { type: String, default: '' },
    status:         { type: String, enum: ['active','inactive','draft'], default: 'active' },
    type:           { type: String, default: 'Video' },
    format:         { type: String, default: 'Video' },
    dv360Status:    { type: String, default: 'Servable' },
    exchangeStatus: { type: String, default: '' },
    duration:       { type: String, default: '' },
    source:         { type: String, default: 'Campaign Manager 360' },
    tagWrapping:    { type: String, default: 'No' },
    previewUrl:     { type: String, default: '' },
    assigned:       { type: Boolean, default: false },
    createdAt:      { type: Date, default: Date.now },
  }],
  cpmRate: { type: String, default: 'A$0.00 CPM' },
}, { timestamps: true });

module.exports = mongoose.model('InsertionOrder', insertionOrderSchema);