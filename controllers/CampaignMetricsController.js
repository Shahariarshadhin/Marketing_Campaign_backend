const CampaignMetrics = require('../models/CampaignMetrics');
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

// @POST /api/metrics/bulk-by-date  — fetch metrics for multiple campaigns on one date
// Body: { campaignIds: [...], date: 'YYYY-MM-DD' }
exports.getBulkByDate = async (req, res) => {
  try {
    const { campaignIds, date } = req.body;
    if (!campaignIds || !date)
      return res.status(400).json({ success: false, message: 'campaignIds and date are required' });

    const normalizedDate = toDate(date);
    const endOfDay = new Date(normalizedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const records = await CampaignMetrics.find({
      campaign: { $in: campaignIds },
      date: { $gte: normalizedDate, $lte: endOfDay }
    }).lean();   // lean() returns plain objects — no Map issues

    // Return as map: { campaignId: record }
    const map = {};
    records.forEach(r => {
      // customFields comes out of lean() as plain object already
      map[r.campaign.toString()] = r;
    });

    res.json({ success: true, data: map, date });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// @GET /api/metrics/:campaignId/all  — all records for a campaign (for the entry panel history)
exports.getAllRecords = async (req, res) => {
  try {
    const records = await CampaignMetrics.find({ campaign: req.params.campaignId })
      .sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// @POST /api/metrics/bulk-by-range
// Body: { campaignIds: [...], startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
// Returns aggregated (summed) metrics per campaign across the date range
exports.getBulkByRange = async (req, res) => {
  try {
    const { campaignIds, startDate, endDate } = req.body;
    if (!campaignIds || !startDate || !endDate)
      return res.status(400).json({ success: false, message: 'campaignIds, startDate, endDate required' });

    const start = toDate(startDate);
    const end   = toDate(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const records = await CampaignMetrics.find({
      campaign: { $in: campaignIds },
      date: { $gte: start, $lte: end }
    });

    // Helper: parse a metric string to number
    const parseVal = (v) => {
      if (v === undefined || v === null || v === '—' || v === '') return null;
      const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? null : n;
    };

    // Group by campaignId, then aggregate
    const groups = {};
    records.forEach(r => {
      const cid = r.campaign.toString();
      if (!groups[cid]) groups[cid] = [];
      groups[cid].push(r);
    });

    const NUM_FIELDS    = ['results','amountSpent','impressions','reach','actions'];
    const LATEST_FIELDS = ['budget','delivery','costPerResult']; // take latest value

    const map = {};
    Object.entries(groups).forEach(([cid, recs]) => {
      const sorted = recs.sort((a, b) => new Date(a.date) - new Date(b.date));
      const agg = { _aggregated: true, days: recs.length, campaignId: cid };

      // Sum numeric fields
      NUM_FIELDS.forEach(field => {
        const nums = sorted.map(r => parseVal(r[field])).filter(n => n !== null);
        agg[field] = nums.length > 0 ? String(nums.reduce((a, b) => a + b, 0).toFixed(2).replace(/\.00$/, '')) : '—';
      });

      // Latest value fields
      LATEST_FIELDS.forEach(field => {
        const last = sorted[sorted.length - 1];
        agg[field] = last[field] || '—';
      });

      // Aggregate custom fields (sum numbers, latest string)
      const cfAgg = {};
      sorted.forEach(r => {
        // Handle Mongoose Map, JS Map, or plain object
        let cf = {};
        if (r.customFields instanceof Map) cf = Object.fromEntries(r.customFields);
        else if (r.customFields && typeof r.customFields.get === 'function') {
          // Mongoose Map — iterate keys
          r.customFields.forEach((v, k) => { cf[k] = v; });
        } else if (r.customFields && typeof r.customFields === 'object') {
          cf = r.customFields;
        }
        Object.entries(cf).forEach(([k, v]) => {
          const n = parseVal(v);
          if (n !== null) cfAgg[k] = (cfAgg[k] || 0) + n;
          else cfAgg[k] = v; // keep latest string value
        });
      });
      agg.customFields = cfAgg;

      map[cid] = agg;
    });

    res.json({ success: true, data: map, startDate, endDate });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};