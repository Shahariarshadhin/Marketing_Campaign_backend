const MotherBrand = require('../models/MotherBrand');
const Campaign    = require('../models/Campaign');
const cloudinary  = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: parse a numeric string like "$1,200.50" → 1200.50
const parseNum = (str) => {
  if (!str || str === '—') return 0;
  return parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0;
};

// Build aggregated stats for a brand from its campaigns
const buildStats = (campaigns) => {
  const total     = campaigns.length;
  const active    = campaigns.filter(c => c.active).length;
  const inactive  = total - active;
  const draft     = campaigns.filter(c => c.status === 'draft').length;
  const scheduled = campaigns.filter(c => c.status === 'scheduled').length;

  const totalBudget     = campaigns.reduce((s, c) => s + parseNum(c.budget),      0);
  const totalSpent      = campaigns.reduce((s, c) => s + parseNum(c.amountSpent), 0);
  const totalImpressions= campaigns.reduce((s, c) => s + parseNum(c.impressions), 0);
  const totalReach      = campaigns.reduce((s, c) => s + parseNum(c.reach),       0);
  const totalResults    = campaigns.reduce((s, c) => s + parseNum(c.results),     0);

  return {
    total, active, inactive, draft, scheduled,
    totalBudget:      totalBudget      ? `$${totalBudget.toLocaleString()}`      : '—',
    totalSpent:       totalSpent       ? `$${totalSpent.toLocaleString()}`       : '—',
    totalImpressions: totalImpressions ? totalImpressions.toLocaleString()       : '—',
    totalReach:       totalReach       ? totalReach.toLocaleString()             : '—',
    totalResults:     totalResults     ? totalResults.toLocaleString()           : '—',
  };
};

// @GET /api/mother-brands  — all brands with aggregated stats
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await MotherBrand.find({ isActive: true }).sort({ name: 1 });

    // For each brand, fetch its campaigns and compute stats
    const result = await Promise.all(brands.map(async (brand) => {
      const campaigns = await Campaign.find({ motherBrand: brand._id });
      return {
        ...brand.toObject(),
        stats:     buildStats(campaigns),
        campaigns: campaigns.slice(0, 5), // preview of latest 5
      };
    }));

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/mother-brands/:id
exports.getBrandById = async (req, res) => {
  try {
    const brand = await MotherBrand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const campaigns = await Campaign.find({ motherBrand: brand._id });
    res.status(200).json({
      success: true,
      data: { ...brand.toObject(), stats: buildStats(campaigns) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/mother-brands
exports.createBrand = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Brand name is required' });

    let logoUrl = '';
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'brand_logos', resource_type: 'image' },
          (err, res) => err ? reject(err) : resolve(res)
        );
        const { Readable } = require('stream');
        const r = new Readable(); r.push(req.file.buffer); r.push(null); r.pipe(stream);
      });
      logoUrl = result.secure_url;
    }

    const brand = await MotherBrand.create({
      name, description: description || '', color: color || '#6366f1',
      logo: logoUrl, createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Brand created', data: brand });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Brand name already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/mother-brands/:id
exports.updateBrand = async (req, res) => {
  try {
    const { name, description, color, isActive } = req.body;
    const update = { name, description, color, isActive };

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'brand_logos', resource_type: 'image' },
          (err, res) => err ? reject(err) : resolve(res)
        );
        const { Readable } = require('stream');
        const r = new Readable(); r.push(req.file.buffer); r.push(null); r.pipe(stream);
      });
      update.logo = result.secure_url;
    }

    const brand = await MotherBrand.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    res.status(200).json({ success: true, message: 'Brand updated', data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/mother-brands/:id
exports.deleteBrand = async (req, res) => {
  try {
    const campaignCount = await Campaign.countDocuments({ motherBrand: req.params.id });
    if (campaignCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${campaignCount} campaign(s) belong to this brand. Reassign or delete them first.`
      });
    }
    await MotherBrand.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/mother-brands/:id/campaigns  — campaigns for one brand (with date filter)
exports.getBrandCampaigns = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { motherBrand: req.params.id };

    const campaigns = await Campaign.find(filter)
      .populate('motherBrand', 'name color logo')
      .sort({ createdAt: -1 })
      .lean();   // plain objects — no Mongoose Map issues

    // Serialize customFields Map → plain object (lean keeps Map as object already,
    // but guard in case it arrives as a Map)
    const normalize = (c) => {
      if (c.customFields && typeof c.customFields.get === 'function') {
        const plain = {};
        c.customFields.forEach((v, k) => { plain[k] = v; });
        c.customFields = plain;
      }
      return c;
    };

    // Apply date filter
    let result = campaigns.map(normalize);
    if (startDate || endDate) {
      const fs = startDate ? new Date(startDate) : null;
      const fe = endDate   ? new Date(endDate)   : null;
      if (fe) fe.setHours(23, 59, 59, 999);
      result = result.filter(c => {
        const cs = c.startDate ? new Date(c.startDate) : null;
        const ce = c.endDate && c.endDate !== 'Ongoing' ? new Date(c.endDate) : null;
        if (!cs && !ce) return true;
        if (fs && ce && ce < fs) return false;
        if (fe && cs && cs > fe) return false;
        return true;
      });
    }

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};