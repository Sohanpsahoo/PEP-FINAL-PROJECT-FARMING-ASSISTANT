const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    due_date: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    category: {
      type: String,
      enum: ['operation', 'scheme', 'price', 'weather', 'pest', 'general'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

reminderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

reminderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reminder', reminderSchema);
