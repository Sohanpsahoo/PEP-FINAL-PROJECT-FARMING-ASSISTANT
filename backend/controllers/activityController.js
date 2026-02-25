const Activity = require('../models/Activity');

// ─── GET /api/activities/ — List activities (with filters) ───────────
exports.listActivities = async (req, res, next) => {
  try {
    const filter = {};

    const farmerId = req.query.farmer_id || req.query.farmer;
    if (farmerId) filter.farmer = farmerId;

    if (req.query.farm_id) filter.farm = req.query.farm_id;
    if (req.query.type) filter.activity_type = req.query.type;

    if (req.query.date_from || req.query.date_to) {
      filter.date = {};
      if (req.query.date_from) filter.date.$gte = new Date(req.query.date_from);
      if (req.query.date_to) filter.date.$lte = new Date(req.query.date_to + 'T23:59:59');
    }

    const limit = parseInt(req.query.limit) || 100;

    const activities = await Activity.find(filter)
      .populate('farmer', 'name phone district state')
      .populate('farm', 'name district')
      .sort({ date: -1 })
      .limit(limit);

    const result = activities.map((a) => {
      const obj = a.toJSON();
      obj.farmer_name = a.farmer?.name || 'Unknown';
      obj.farm_name = a.farm?.name || '';
      return obj;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/activities/quick_add/ — Create activity ───────────────
exports.quickAdd = async (req, res, next) => {
  try {
    const { farmer, farm, activity_type, text_note, date, amount } = req.body;

    if (!farmer) {
      return res.status(400).json({ message: 'Farmer ID is required' });
    }

    const activity = await Activity.create({
      farmer,
      farm: farm || undefined,
      activity_type: activity_type || 'other',
      text_note: text_note || '',
      date: date ? new Date(date) : new Date(),
      amount: amount || undefined,
    });

    await activity.populate('farmer', 'name phone district state');
    await activity.populate('farm', 'name district');

    const result = activity.toJSON();
    result.farmer_name = activity.farmer?.name || 'Unknown';
    result.farm_name = activity.farm?.name || '';

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/activities/:id/ — Get single activity ──────────────────
exports.getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('farmer', 'name phone district state')
      .populate('farm', 'name district');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const result = activity.toJSON();
    result.farmer_name = activity.farmer?.name || 'Unknown';
    result.farm_name = activity.farm?.name || '';
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/activities/:id/ — Delete activity ───────────────────
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    next(err);
  }
};
