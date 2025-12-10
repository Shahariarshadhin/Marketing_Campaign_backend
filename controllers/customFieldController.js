
const CustomField = require('../models/CustomField');

// Get all custom fields
exports.getAllCustomFields = async (req, res) => {
  try {
    const fields = await CustomField.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: fields.length,
      data: fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching custom fields',
      error: error.message
    });
  }
};

// Get single custom field by ID
exports.getCustomFieldById = async (req, res) => {
  try {
    const field = await CustomField.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Custom field not found'
      });
    }

    res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching custom field',
      error: error.message
    });
  }
};

// Create new custom field
exports.createCustomField = async (req, res) => {
  try {
    const field = await CustomField.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Custom field created successfully',
      data: field
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A field with this name already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating custom field',
      error: error.message
    });
  }
};

// Update custom field
exports.updateCustomField = async (req, res) => {
  try {
    const field = await CustomField.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Custom field not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Custom field updated successfully',
      data: field
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating custom field',
      error: error.message
    });
  }
};

// Delete custom field
exports.deleteCustomField = async (req, res) => {
  try {
    const field = await CustomField.findByIdAndDelete(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Custom field not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Custom field deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting custom field',
      error: error.message
    });
  }
};