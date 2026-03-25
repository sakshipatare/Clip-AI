const router = require('express').Router();
const Clip = require('../models/Clip');
const authMiddleware = require('../middleware/auth');
const { deleteFromCloudinary } = require('../services/cloudinary');

router.use(authMiddleware);

// GET /api/clips?projectId=xxx — get clips for a project
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId query param required' });
    const clips = await Clip.find({ projectId }).sort({ score: -1 });
    res.json(clips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clips/:id/status — approve / reject / regenerate
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const clip = await Clip.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    if (!clip) return res.status(404).json({ error: 'Clip not found' });
    res.json(clip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clips/:id — delete a clip
router.delete('/:id', async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.id);
    if (!clip) return res.status(404).json({ error: 'Clip not found' });

    // Delete from Cloudinary if it exists
    if (clip.cloudinaryClipId) {
      try {
        await deleteFromCloudinary(clip.cloudinaryClipId, 'video');
      } catch (err) {
        console.error('Failed to delete from Cloudinary, continuing with DB deletion:', err);
      }
    }

    // Delete from MongoDB
    await Clip.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Clip deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
