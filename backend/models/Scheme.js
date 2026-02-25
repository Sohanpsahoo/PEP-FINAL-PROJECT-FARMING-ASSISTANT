const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  category:      { type: String, enum: ['national', 'state'], default: 'national' },
  state:         { type: String, default: 'All India', index: true },
  department:    { type: String, default: 'Ministry of Agriculture & Farmers Welfare' },
  description:   { type: String, default: '' },
  highlights:    [{ type: String }],
  eligibility:   { type: String, default: '' },
  benefits:      { type: String, default: '' },
  official_url:  { type: String, default: '' },
  launch_year:   { type: String, default: '' },
  status:        { type: String, enum: ['active', 'closed', 'upcoming'], default: 'active' },
  tags:          [{ type: String }]
}, { timestamps: true });

schemeSchema.virtual('id').get(function () { return this._id.toHexString(); });
schemeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Scheme', schemeSchema);
