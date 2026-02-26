
// const Campaign = require('../models/Campaign');

// // Get all campaigns
// exports.getAllCampaigns = async (req, res) => {
//   try {
//     const campaigns = await Campaign.find().sort({ createdAt: -1 });
    
//     res.status(200).json({
//       success: true,
//       count: campaigns.length,
//       data: campaigns
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching campaigns',
//       error: error.message
//     });
//   }
// };

// // Get single campaign by ID
// exports.getCampaignById = async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);
    
//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: campaign
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching campaign',
//       error: error.message
//     });
//   }
// };

// // Create new campaign
// exports.createCampaign = async (req, res) => {
//   try {
//     const campaign = await Campaign.create(req.body);

//     res.status(201).json({
//       success: true,
//       message: 'Campaign created successfully',
//       data: campaign
//     });
//   } catch (error) {
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         error: error.message
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Error creating campaign',
//       error: error.message
//     });
//   }
// };

// // Update campaign
// exports.updateCampaign = async (req, res) => {
//   try {
//     const campaign = await Campaign.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Campaign updated successfully',
//       data: campaign
//     });
//   } catch (error) {
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         error: error.message
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Error updating campaign',
//       error: error.message
//     });
//   }
// };

// // Delete campaign
// exports.deleteCampaign = async (req, res) => {
//   try {
//     const campaign = await Campaign.findByIdAndDelete(req.params.id);

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Campaign deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting campaign',
//       error: error.message
//     });
//   }
// };

// // Duplicate campaign
// exports.duplicateCampaign = async (req, res) => {
//   try {
//     const originalCampaign = await Campaign.findById(req.params.id);

//     if (!originalCampaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign not found'
//       });
//     }

//     const campaignData = originalCampaign.toObject();
//     delete campaignData._id;
//     delete campaignData.createdAt;
//     delete campaignData.updatedAt;
//     delete campaignData.__v;
    
//     campaignData.name = `${campaignData.name} (Copy)`;

//     const duplicatedCampaign = await Campaign.create(campaignData);

//     res.status(201).json({
//       success: true,
//       message: 'Campaign duplicated successfully',
//       data: duplicatedCampaign
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error duplicating campaign',
//       error: error.message
//     });
//   }
// };

// // Toggle campaign active status
// exports.toggleCampaignActive = async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign not found'
//       });
//     }

//     campaign.active = !campaign.active;
//     await campaign.save();

//     res.status(200).json({
//       success: true,
//       message: 'Campaign active status toggled successfully',
//       data: campaign
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error toggling campaign status',
//       error: error.message
//     });
//   }
// };

const Campaign = require('../models/Campaign');

// Get all campaigns (with viewer filtering)
exports.getAllCampaigns = async (req, res) => {
  try {
    let query = {};

    // If viewer, filter to only allowed campaigns
    if (req.viewerFilter) {
      if (!req.viewAllCampaigns) {
        if (!req.allowedCampaigns || req.allowedCampaigns.length === 0) {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
        query._id = { $in: req.allowedCampaigns };
      }
      // If viewAllCampaigns is true, no filter needed
    }

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching campaigns', error: error.message });
  }
};

// Get single campaign by ID (with viewer access check)
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Check viewer access
    if (req.viewerFilter && !req.viewAllCampaigns) {
      const allowed = req.allowedCampaigns.map(id => id.toString());
      if (!allowed.includes(campaign._id.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied to this campaign' });
      }
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching campaign', error: error.message });
  }
};

// Create new campaign (admin only)
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json({ success: true, message: 'Campaign created successfully', data: campaign });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', error: error.message });
    }
    res.status(500).json({ success: false, message: 'Error creating campaign', error: error.message });
  }
};

// Update campaign (admin only)
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    res.status(200).json({ success: true, message: 'Campaign updated successfully', data: campaign });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation error', error: error.message });
    }
    res.status(500).json({ success: false, message: 'Error updating campaign', error: error.message });
  }
};

// Delete campaign (admin only)
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting campaign', error: error.message });
  }
};

// Duplicate campaign (admin only)
exports.duplicateCampaign = async (req, res) => {
  try {
    const originalCampaign = await Campaign.findById(req.params.id);
    if (!originalCampaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const campaignData = originalCampaign.toObject();
    delete campaignData._id;
    delete campaignData.createdAt;
    delete campaignData.updatedAt;
    delete campaignData.__v;
    campaignData.name = `${campaignData.name} (Copy)`;

    const duplicatedCampaign = await Campaign.create(campaignData);
    res.status(201).json({ success: true, message: 'Campaign duplicated successfully', data: duplicatedCampaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error duplicating campaign', error: error.message });
  }
};

// Toggle campaign active status (admin only)
exports.toggleCampaignActive = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    campaign.active = !campaign.active;
    await campaign.save();

    res.status(200).json({ success: true, message: 'Campaign active status toggled', data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling campaign status', error: error.message });
  }
};