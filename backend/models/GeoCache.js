const mongoose = require('mongoose');

const geoCacheSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so lookups by (district, state) are fast
geoCacheSchema.index({ district: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('GeoCache', geoCacheSchema);
