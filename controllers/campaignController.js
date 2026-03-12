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

const Campaign = require("../models/Campaign");
const MotherBrand = require("../models/MotherBrand");

const normalizeCampaign = (c) => {
  if (!c) return c;
  const obj = typeof c.toObject === "function" ? c.toObject() : c;
  if (obj.customFields && typeof obj.customFields.get === "function") {
    const plain = {};
    obj.customFields.forEach((v, k) => {
      plain[k] = v;
    });
    obj.customFields = plain;
  }
  return obj;
};
// Get all campaigns (with viewer filtering)
exports.getAllCampaigns = async (req, res) => {
  try {
    const filter = {};

    // Viewer: only see allowed campaigns
    if (req.viewerFilter) Object.assign(filter, req.viewerFilter);

    // Optional brand filter
    if (req.query.brandId) filter.motherBrand = req.query.brandId;

    const campaigns = await Campaign.find(filter)
      .populate("motherBrand", "name color logo")
      .sort({ createdAt: -1 })
      .lean();

    res
      .status(200)
      .json({
        success: true,
        count: campaigns.length,
        data: campaigns.map(normalizeCampaign),
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/campaigns/:id
exports.getCampaignById = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.viewerFilter?.motherBrand)
      filter.motherBrand = req.viewerFilter.motherBrand;

    const campaign = await Campaign.findOne(filter).populate(
      "motherBrand",
      "name color logo",
    );
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/campaigns
exports.createCampaign = async (req, res) => {
  try {
    const { motherBrand, ...rest } = req.body;
    if (!motherBrand)
      return res
        .status(400)
        .json({ success: false, message: "motherBrand is required" });

    const brand = await MotherBrand.findById(motherBrand);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Mother brand not found" });

    const campaign = await Campaign.create({
      motherBrand,
      ...rest,
      createdBy: req.user._id,
    });
    await campaign.populate("motherBrand", "name color logo");

    res
      .status(201)
      .json({ success: true, message: "Campaign created", data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/campaigns/:id
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("motherBrand", "name color logo");
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    res
      .status(200)
      .json({ success: true, message: "Campaign updated", data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/campaigns/:id
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @POST /api/campaigns/:id/duplicate
exports.duplicateCampaign = async (req, res) => {
  try {
    const original = await Campaign.findById(req.params.id);
    if (!original)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });

    const copy = original.toObject();
    delete copy._id;
    delete copy.createdAt;
    delete copy.updatedAt;
    copy.name = `${copy.name} (Copy)`;

    const newCampaign = await Campaign.create(copy);
    await newCampaign.populate("motherBrand", "name color logo");
    res.status(201).json({ success: true, data: newCampaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle campaign active status (admin only)
exports.toggleCampaignActive = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    campaign.active = !campaign.active;
    campaign.status = campaign.active ? "active" : "paused";
    campaign.delivery = campaign.active ? "Active" : "Paused";
    await campaign.save();
    await campaign.populate("motherBrand", "name color logo");
    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
