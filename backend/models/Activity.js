const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer is required'],
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
    },
    activity_type: {
      type: String,
      required: [true, 'Activity type is required'],
      enum: ['sowing', 'irrigation', 'fertilizer', 'pesticide', 'weeding', 'harvesting', 'pest_issue', 'disease_issue', 'other'],
      default: 'other',
    },
    text_note: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    amount: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

activitySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

activitySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Activity', activitySchema);
