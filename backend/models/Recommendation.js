const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  farmer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
  category:    { type: String, enum: ['crop', 'soil', 'irrigation', 'pest', 'fertilizer', 'market', 'general', 'best_practice'], default: 'general' },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  impact:      { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  priority:    { type: Number, default: 5, min: 1, max: 10 },
  source_data: {
    farms:      [{ type: Object }],
    activities: [{ type: Object }],
    weather:    { type: Object }
  },
  tags:        [{ type: String }],
  is_read:     { type: Boolean, default: false },
  is_saved:    { type: Boolean, default: false }
}, { timestamps: true });

recommendationSchema.virtual('id').get(function () { return this._id.toHexString(); });
recommendationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);
