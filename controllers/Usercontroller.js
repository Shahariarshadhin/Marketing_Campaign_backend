const User = require('../models/User');
const Campaign = require('../models/Campaign');

const ALL_FIELDS = [
  { key: 'name',          label: 'Campaign Name' },
  { key: 'delivery',      label: 'Delivery' },
  { key: 'status',        label: 'Status' },
  { key: 'actions',       label: 'Actions' },
  { key: 'results',       label: 'Results' },
  { key: 'costPerResult', label: 'Cost per Result' },
  { key: 'budget',        label: 'Budget' },
  { key: 'amountSpent',   label: 'Amount Spent' },
  { key: 'impressions',   label: 'Impressions' },
  { key: 'reach',         label: 'Reach' },
  { key: 'endDate',       label: 'End Date' },
  { key: 'active',        label: 'Active Status' },
];


// @GET /api/users/fields  - return all available fields (for admin UI)
exports.getAvailableFields = (req, res) => {
  res.status(200).json({ success: true, data: ALL_FIELDS });
};

// @GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'viewer' })
      .select('-password')
      .populate('allowedCampaigns', 'name status')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// @GET /api/users  - Get all viewers (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'viewer' })
      .select('-password')
      .populate('allowedCampaigns', 'name status')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// @GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('allowedCampaigns', 'name status delivery');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

// @PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, email, isActive, viewAllCampaigns } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, isActive, viewAllCampaigns },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

// @DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

// @PUT /api/users/:id/campaigns  - assign campaigns AND visible fields
exports.assignCampaigns = async (req, res) => {
  try {
    const { campaignIds, viewAllCampaigns, visibleFields } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'viewer') return res.status(400).json({ success: false, message: 'Can only assign campaigns to viewers' });

    if (viewAllCampaigns !== undefined) user.viewAllCampaigns = viewAllCampaigns;
    if (campaignIds !== undefined) user.allowedCampaigns = campaignIds;
    if (visibleFields !== undefined) user.visibleFields = visibleFields;

    await user.save();
    await user.populate('allowedCampaigns', 'name status delivery');

    res.status(200).json({ success: true, message: 'Access settings saved', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning campaigns', error: error.message });
  }
};

// @GET /api/users/:id/shareable-link
exports.getShareableLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'viewer') {
      return res.status(404).json({ success: false, message: 'Viewer not found' });
    }
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableLink = `${baseUrl}/viewer`;
    res.status(200).json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, email: user.email },
        shareableLink,
        note: 'Share this link. The viewer must login with their credentials.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating link', error: error.message });
  }
};
