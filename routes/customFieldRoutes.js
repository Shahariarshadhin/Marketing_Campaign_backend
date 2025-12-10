
const express = require('express');
const router = express.Router();
const customFieldController = require('../controllers/customFieldController');

// GET all custom fields
router.get('/', customFieldController.getAllCustomFields);

// GET single custom field by ID
router.get('/:id', customFieldController.getCustomFieldById);

// POST create new custom field
router.post('/', customFieldController.createCustomField);

// PUT update custom field
router.put('/:id', customFieldController.updateCustomField);

// DELETE custom field
router.delete('/:id', customFieldController.deleteCustomField);

module.exports = router;