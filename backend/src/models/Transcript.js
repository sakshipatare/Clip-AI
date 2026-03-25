const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    words: [
      {
        word: String,
        startTime: Number,
        endTime: Number,
        speakerId: String,
      },
    ],
    fullText: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transcript', transcriptSchema);
