const Reminder = require('../models/Reminder');

// ─── GET /api/reminders/ — List reminders (with filters) ────────────
exports.listReminders = async (req, res, next) => {
  try {
    const filter = {};

    const farmerId = req.query.farmer_id || req.query.farmer;
    if (farmerId) filter.farmer = farmerId;

    if (req.query.category) filter.category = req.query.category;
    if (req.query.priority) filter.priority = req.query.priority;

    if (req.query.is_completed !== undefined && req.query.is_completed !== '') {
      filter.is_completed = req.query.is_completed === 'true';
    }

    const limit = parseInt(req.query.limit) || 100;

    const reminders = await Reminder.find(filter)
      .populate('farmer', 'name phone district state')
      .sort({ due_date: 1 })
      .limit(limit);

    const result = reminders.map((r) => {
      const obj = r.toJSON();
      obj.farmer_name = r.farmer?.name || 'Unknown';
      return obj;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/reminders/ — Create reminder ─────────────────────────
exports.createReminder = async (req, res, next) => {
  try {
    const { farmer, title, description, due_date, category, priority } = req.body;

    if (!farmer) {
      return res.status(400).json({ message: 'Farmer ID is required' });
    }

    const reminder = await Reminder.create({
      farmer,
      title,
      description: description || '',
      due_date: new Date(due_date),
      category: category || 'general',
      priority: priority || 'medium',
    });

    await reminder.populate('farmer', 'name phone district state');
    const result = reminder.toJSON();
    result.farmer_name = reminder.farmer?.name || 'Unknown';

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/reminders/:id/mark_completed/ — Toggle completion ────
exports.markCompleted = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    reminder.is_completed = !reminder.is_completed;
    await reminder.save();

    await reminder.populate('farmer', 'name phone district state');
    const result = reminder.toJSON();
    result.farmer_name = reminder.farmer?.name || 'Unknown';

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/reminders/:id/ — Delete reminder ────────────────────
exports.deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (err) {
    next(err);
  }
};
