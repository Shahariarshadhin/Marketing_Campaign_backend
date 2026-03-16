const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  label: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String,
    enum: ['text', 'number', 'email', 'date', 'textarea', 'select', 'checkbox', 'url', 'boolean'],
    default: 'text'
  },
  category: {
    type: String,
    default: ''   // e.g. 'Performance', 'Conversions', 'Viewability', etc.
  },
  required: { 
    type: Boolean, 
    default: false 
  },
  placeholder: { 
    type: String,
    default: ''
  },
  description: { 
    type: String,
    default: ''
  },
  options: [{ 
    type: String 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomField', customFieldSchema);