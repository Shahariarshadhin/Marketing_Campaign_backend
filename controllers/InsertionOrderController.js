const InsertionOrder = require('../models/InsertionOrders');
const Campaign       = require('../models/Campaign');

// GET /api/insertion-orders/:campaignId
exports.getOrders = async (req, res) => {
  try {
    const orders = await InsertionOrder.find({ campaign: req.params.campaignId })
      .populate('campaign', 'name motherBrand')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/insertion-orders/:campaignId/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await InsertionOrder.findOne({ _id: req.params.id, campaign: req.params.campaignId });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/insertion-orders/:campaignId
exports.createOrder = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const order = await InsertionOrder.create({
      ...req.body,
      campaign: req.params.campaignId,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: order });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// PUT /api/insertion-orders/:campaignId/:id
exports.updateOrder = async (req, res) => {
  try {
    const order = await InsertionOrder.findOneAndUpdate(
      { _id: req.params.id, campaign: req.params.campaignId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: order });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// DELETE /api/insertion-orders/:campaignId/:id
exports.deleteOrder = async (req, res) => {
  try {
    const order = await InsertionOrder.findOneAndDelete({ _id: req.params.id, campaign: req.params.campaignId });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PATCH /api/insertion-orders/:campaignId/:id/toggle
exports.toggleOrder = async (req, res) => {
  try {
    const order = await InsertionOrder.findOne({ _id: req.params.id, campaign: req.params.campaignId });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    order.active  = !order.active;
    order.status  = order.active ? 'active' : 'paused';
    await order.save();
    res.json({ success: true, data: order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};