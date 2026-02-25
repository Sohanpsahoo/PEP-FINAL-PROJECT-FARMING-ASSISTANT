const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  state:        { type: String, required: true, index: true },
  district:     { type: String, index: true },
  market:       { type: String, required: true },
  commodity:    { type: String, required: true, index: true },
  variety:      { type: String, default: 'Other' },
  grade:        { type: String, default: 'FAQ' },
  min_price:    { type: Number, default: 0 },
  max_price:    { type: Number, default: 0 },
  modal_price:  { type: Number, default: 0 },
  arrival_date: { type: Date },
  fetched_at:   { type: Date, default: Date.now }
}, { timestamps: true });

marketPriceSchema.index({ state: 1, commodity: 1, arrival_date: -1 });
marketPriceSchema.virtual('id').get(function () { return this._id.toHexString(); });
marketPriceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
