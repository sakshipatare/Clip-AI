const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    startTime: { type: Number, required: true },   // seconds
    endTime: { type: Number, required: true },     // seconds
    duration: { type: Number },
    textSnippet: { type: String },
    score: { type: Number, default: 0 },
    metrics: {
      hook: { type: Number, default: 0 },
      payoff: { type: Number, default: 0 },
      pace: { type: Number, default: 0 },
      audioEnergy: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'generated', 'approved', 'rejected'],
      default: 'pending',
    },
    cloudinaryClipId: { type: String },
    cloudinaryThumbnailUrl: { type: String },
    subtitleUrl: { type: String },
    format: { type: String, default: '9:16' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clip', clipSchema);
