const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  farmer:         { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  type:           { type: String, enum: ['buy', 'sell'], required: true },
  commodity:      { type: String, required: true },
  variety:        { type: String, default: 'Standard' },
  market:         { type: String, required: true },
  state:          { type: String },
  district:       { type: String },
  quantity:       { type: Number, required: true, min: 0.1 },
  unit:           { type: String, default: 'quintal' },
  price_per_unit: { type: Number, required: true },
  total_price:    { type: Number, required: true },
  status:         { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  notes:          { type: String }
}, { timestamps: true });

transactionSchema.virtual('id').get(function () { return this._id.toHexString(); });
transactionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema);
