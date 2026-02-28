const Campaign        = require('../models/Campaign');
const Campaigncontent = require('../models/Campaigncontent');
const cloudinary      = require('cloudinary').v2;


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: upload a single buffer to Cloudinary
async function uploadToCloudinary(buffer, originalname, resourceType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:          'campaign_content',
        resource_type:   resourceType,   // 'image' or 'video'
        use_filename:    true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    // Write buffer to stream
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// @GET /api/campaign-content/:campaignId
exports.getContent = async (req, res) => {
  try {
    const content = await Campaigncontent.findOne({ campaign: req.params.campaignId });
    res.status(200).json({ success: true, data: content || null });
  } catch (error) {
    console.error('getContent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/campaign-content/:campaignId — upload media files
exports.saveContent = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Debug log — check what arrived
    console.log('📁 Files received:', req.files ? req.files.length : 0);
    console.log('📝 Body:', req.body);
    console.log('☁️  Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ set' : '❌ MISSING',
      api_key:    process.env.CLOUDINARY_API_KEY    ? '✅ set' : '❌ MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ set' : '❌ MISSING',
    });

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const { youtubeUrl, facebookUrl, description } = req.body;

    // Upload files one by one
    const newMedia = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log(`⬆️  Uploading: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
        
        // Determine resource type
        const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        
        try {
          const result = await uploadToCloudinary(file.buffer, file.originalname, resourceType);
          console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
          newMedia.push({
            url:          result.secure_url,
            publicId:     result.public_id,
            type:         resourceType,
            originalName: file.originalname,
            size:         file.size,
          });
        } catch (uploadErr) {
          console.error(`❌ Failed to upload ${file.originalname}:`, uploadErr.message);
          return res.status(500).json({
            success: false,
            message: `Cloudinary upload failed for ${file.originalname}: ${uploadErr.message}`,
          });
        }
      }
    }

    // Upsert content document
    let content = await Campaigncontent.findOne({ campaign: campaignId });
    if (content) {
      if (youtubeUrl  !== undefined) content.youtubeUrl  = youtubeUrl;
      if (facebookUrl !== undefined) content.facebookUrl = facebookUrl;
      if (description !== undefined) content.description = description;
      content.media.push(...newMedia);
      await content.save();
    } else {
      content = await Campaigncontent.create({
        campaign:    campaignId,
        youtubeUrl:  youtubeUrl  || '',
        facebookUrl: facebookUrl || '',
        description: description || '',
        media:       newMedia,
        createdBy:   req.user._id,
      });
    }

    res.status(200).json({ success: true, message: 'Content saved', data: content });
  } catch (error) {
    console.error('saveContent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/campaign-content/:campaignId/media/:mediaId
exports.deleteMedia = async (req, res) => {
  try {
    const content = await Campaigncontent.findOne({ campaign: req.params.campaignId });
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

    const mediaItem = content.media.id(req.params.mediaId);
    if (!mediaItem) return res.status(404).json({ success: false, message: 'Media not found' });

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(mediaItem.publicId, {
        resource_type: mediaItem.type === 'video' ? 'video' : 'image',
      });
      console.log(`🗑️  Deleted from Cloudinary: ${mediaItem.publicId}`);
    } catch (cloudErr) {
      // Log but don't fail — still remove from DB
      console.warn('⚠️  Cloudinary delete warning:', cloudErr.message);
    }

    mediaItem.deleteOne();
    await content.save();

    res.status(200).json({ success: true, message: 'Media deleted', data: content });
  } catch (error) {
    console.error('deleteMedia error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/campaign-content/:campaignId/links
exports.updateLinks = async (req, res) => {
  try {
    const { youtubeUrl, facebookUrl, description } = req.body;
    let content = await Campaigncontent.findOne({ campaign: req.params.campaignId });

    if (!content) {
      content = await Campaigncontent.create({
        campaign:    req.params.campaignId,
        youtubeUrl:  youtubeUrl  || '',
        facebookUrl: facebookUrl || '',
        description: description || '',
        createdBy:   req.user._id,
      });
    } else {
      if (youtubeUrl  !== undefined) content.youtubeUrl  = youtubeUrl;
      if (facebookUrl !== undefined) content.facebookUrl = facebookUrl;
      if (description !== undefined) content.description = description;
      await content.save();
    }

    res.status(200).json({ success: true, message: 'Links updated', data: content });
  } catch (error) {
    console.error('updateLinks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};




// const Campaign        = require('../models/Campaign');
// const Campaigncontent = require('../models/Campaigncontent');
// const cloudinary      = require('cloudinary').v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key:    process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Helper: upload a single buffer to cloudinary
// async function uploadToCloudinary(buffer, originalname, resourceType) {
//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         folder: 'campaign_content',
//         resource_type: resourceType, // 'image' or 'video'
//         use_filename: true,
//         unique_filename: true,
//       },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       }
//     );
//     uploadStream.end(buffer);
//   });
// }

// // @GET /api/campaign-content/:campaignId
// exports.getContent = async (req, res) => {
//   try {
//     const content = await Campaigncontent.findOne({ campaign: req.params.campaignId });
//     res.status(200).json({ success: true, data: content || null });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
//   }
// };

// // @POST /api/campaign-content/:campaignId  — create or update
// exports.saveContent = async (req, res) => {
//   try {
//     const { campaignId } = req.params;

//     // Verify campaign exists
//     const campaign = await Campaign.findById(campaignId);
//     if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

//     const { youtubeUrl, facebookUrl, description } = req.body;

//     // Upload any new files
//     const newMedia = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
//         const result = await uploadToCloudinary(file.buffer, file.originalname, resourceType);
//         newMedia.push({
//           url:          result.secure_url,
//           publicId:     result.public_id,
//           type:         resourceType,
//           originalName: file.originalname,
//           size:         file.size,
//         });
//       }
//     }

//     // Upsert
//     let content = await CampaignContent.findOne({ campaign: campaignId });
//     if (content) {
//       content.youtubeUrl  = youtubeUrl  || content.youtubeUrl;
//       content.facebookUrl = facebookUrl || content.facebookUrl;
//       content.description = description !== undefined ? description : content.description;
//       content.media.push(...newMedia);
//       await content.save();
//     } else {
//       content = await CampaignContent.create({
//         campaign:    campaignId,
//         youtubeUrl:  youtubeUrl  || '',
//         facebookUrl: facebookUrl || '',
//         description: description || '',
//         media:       newMedia,
//         createdBy:   req.user._id,
//       });
//     }

//     res.status(200).json({ success: true, message: 'Content saved', data: content });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error saving content', error: error.message });
//   }
// };

// // @DELETE /api/campaign-content/:campaignId/media/:mediaId
// exports.deleteMedia = async (req, res) => {
//   try {
//     const content = await CampaignContent.findOne({ campaign: req.params.campaignId });
//     if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

//     const mediaItem = content.media.id(req.params.mediaId);
//     if (!mediaItem) return res.status(404).json({ success: false, message: 'Media not found' });

//     // Delete from Cloudinary
//     await cloudinary.uploader.destroy(mediaItem.publicId, {
//       resource_type: mediaItem.type === 'video' ? 'video' : 'image'
//     });

//     mediaItem.deleteOne();
//     await content.save();

//     res.status(200).json({ success: true, message: 'Media deleted', data: content });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error deleting media', error: error.message });
//   }
// };

// // @PUT /api/campaign-content/:campaignId/links  — update only links/description
// exports.updateLinks = async (req, res) => {
//   try {
//     const { youtubeUrl, facebookUrl, description } = req.body;
//     let content = await CampaignContent.findOne({ campaign: req.params.campaignId });

//     if (!content) {
//       content = await CampaignContent.create({
//         campaign: req.params.campaignId,
//         youtubeUrl:  youtubeUrl  || '',
//         facebookUrl: facebookUrl || '',
//         description: description || '',
//         createdBy: req.user._id,
//       });
//     } else {
//       content.youtubeUrl  = youtubeUrl  !== undefined ? youtubeUrl  : content.youtubeUrl;
//       content.facebookUrl = facebookUrl !== undefined ? facebookUrl : content.facebookUrl;
//       content.description = description !== undefined ? description : content.description;
//       await content.save();
//     }

//     res.status(200).json({ success: true, message: 'Links updated', data: content });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error updating links', error: error.message });
//   }
// };


// const CampaignContent = require('../models/CampaignContent');
// const Campaign        = require('../models/Campaign');
// const cloudinary      = require('cloudinary').v2;