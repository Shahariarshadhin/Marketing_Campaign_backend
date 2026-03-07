const CampaignMetrics = require('../models/Campaignmetrics');
const Campaign        = require('../models/Campaign');

// Helper: normalize date to midnight UTC
const toDate = (str) => {
  const d = new Date(str);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// @GET /api/metrics/:campaignId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns all daily records for a campaign within date range
exports.getMetrics = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { campaign: campaignId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = toDate(startDate);
      if (endDate) {
        const end = toDate(endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const metrics = await CampaignMetrics.find(filter).sort({ date: 1 });
    res.status(200).json({ success: true, count: metrics.length, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/metrics/:campaignId/summary?startDate=&endDate=
// Returns aggregated/summarized data for a date range
exports.getSummary = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { campaign: campaignId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = toDate(startDate);
      if (endDate) {
        const end = toDate(endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const metrics = await CampaignMetrics.find(filter).sort({ date: 1 });

    if (metrics.length === 0) {
      return res.status(200).json({ success: true, data: null, count: 0 });
    }

    // Aggregate numeric values where possible
    const aggregate = (field) => {
      const nums = metrics
        .map(m => parseFloat(String(m[field]).replace(/[^0-9.-]/g, '')))
        .filter(n => !isNaN(n));
      if (nums.length === 0) return '—';
      const sum = nums.reduce((a, b) => a + b, 0);
      return sum % 1 === 0 ? sum.toString() : sum.toFixed(2);
    };

    const avgOrLast = (field) => {
      const nums = metrics
        .map(m => parseFloat(String(m[field]).replace(/[^0-9.-]/g, '')))
        .filter(n => !isNaN(n));
      if (nums.length === 0) return metrics[metrics.length - 1][field] || '—';
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      return avg % 1 === 0 ? avg.toString() : avg.toFixed(2);
    };

    const summary = {
      dateRange: {
        from:  metrics[0].date,
        to:    metrics[metrics.length - 1].date,
        days:  metrics.length
      },
      results:       aggregate('results'),
      amountSpent:   aggregate('amountSpent'),
      impressions:   aggregate('impressions'),
      reach:         aggregate('reach'),
      actions:       aggregate('actions'),
      costPerResult: avgOrLast('costPerResult'),
      budget:        metrics[metrics.length - 1].budget,
      delivery:      metrics[metrics.length - 1].delivery,
      // Raw daily data for charts
      daily: metrics.map(m => ({
        date:          m.date,
        results:       m.results,
        amountSpent:   m.amountSpent,
        impressions:   m.impressions,
        reach:         m.reach,
        costPerResult: m.costPerResult,
        actions:       m.actions,
        delivery:      m.delivery,
        customFields:  m.customFields,
      }))
    };

    res.status(200).json({ success: true, data: summary, count: metrics.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/metrics/:campaignId  — admin creates/updates a daily record
exports.upsertMetrics = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { date, results, costPerResult, budget, amountSpent,
            impressions, reach, actions, delivery, customFields } = req.body;

    if (!date) return res.status(400).json({ success: false, message: 'date is required' });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const normalizedDate = toDate(date);

    const record = await CampaignMetrics.findOneAndUpdate(
      { campaign: campaignId, date: normalizedDate },
      {
        $set: {
          results:       results       ?? '—',
          costPerResult: costPerResult ?? '—',
          budget:        budget        ?? '—',
          amountSpent:   amountSpent   ?? '—',
          impressions:   impressions   ?? '—',
          reach:         reach         ?? '—',
          actions:       actions       ?? '—',
          delivery:      delivery      ?? '—',
          customFields:  customFields  || {},
          createdBy:     req.user._id,
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: 'Metrics saved', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/metrics/:campaignId/bulk  — save multiple days at once
exports.bulkUpsert = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { records } = req.body; // array of daily records

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'records array is required' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const ops = records.map(r => ({
      updateOne: {
        filter: { campaign: campaignId, date: toDate(r.date) },
        update: {
          $set: {
            results:       r.results       ?? '—',
            costPerResult: r.costPerResult ?? '—',
            budget:        r.budget        ?? '—',
            amountSpent:   r.amountSpent   ?? '—',
            impressions:   r.impressions   ?? '—',
            reach:         r.reach         ?? '—',
            actions:       r.actions       ?? '—',
            delivery:      r.delivery      ?? '—',
            customFields:  r.customFields  || {},
            createdBy:     req.user._id,
          }
        },
        upsert: true
      }
    }));

    await CampaignMetrics.bulkWrite(ops);
    res.status(200).json({ success: true, message: `${records.length} records saved` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/metrics/:campaignId/:recordId
exports.deleteMetrics = async (req, res) => {
  try {
    const record = await CampaignMetrics.findByIdAndDelete(req.params.recordId);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};