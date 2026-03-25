const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled Project' },
    originalVideoUrl: { type: String },        // Cloudinary URL
    cloudinaryRawId: { type: String },          // Cloudinary public_id
    status: {
      type: String,
      enum: ['uploading', 'analyzing', 'processing', 'done', 'failed'],
      default: 'uploading',
    },
    progress: { type: Number, default: 0 },
    duration: { type: Number },                 // seconds
    clipDuration: { type: Number, default: 60 }, // desired clip length in seconds
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
