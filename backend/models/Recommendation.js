const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer" },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", default: null },

    soilData: {
      N: { type: Number, required: true },
      P: { type: Number, required: true },
      K: { type: Number, required: true },
      ph: { type: Number, required: true },
    },

    weather: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      location: String,
    },

    recommendedCrop: { type: String, required: true },
    confidence: { type: Number },
    alternativeCrops: [{ type: String }],

    // Gemini-generated fields
    explanation: { type: String },
    soilInsights: { type: String },
    growingTips: [{ type: String }],
    warnings: [{ type: String }],
    bestSowingTime: { type: String },
    estimatedYield: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", RecommendationSchema);
