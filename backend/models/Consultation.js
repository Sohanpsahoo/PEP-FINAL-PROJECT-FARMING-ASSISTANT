const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  farmer:            { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  officer:           { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
  subject:           { type: String, required: true },
  description:       { type: String, default: '' },
  consultation_type: { type: String, enum: ['phone', 'video', 'visit', 'office'], default: 'phone' },
  preferred_date:    { type: Date, required: true },
  preferred_time:    { type: String, default: '10:00 AM' },
  status:            { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  farmer_phone:      { type: String, default: '' },
  farmer_location:   { type: String, default: '' },
  notes:             { type: String, default: '' }
}, { timestamps: true });

consultationSchema.virtual('id').get(function () { return this._id.toHexString(); });
consultationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Consultation', consultationSchema);
