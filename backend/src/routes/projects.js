const router = require('express').Router();
const Project = require('../models/Project');
const { generateUploadSignature } = require('../services/cloudinary');
const authMiddleware = require('../middleware/auth');

// All project routes require authentication
router.use(authMiddleware);

// GET /api/projects — list user's projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id — single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/upload-signature — get Cloudinary signed upload params
router.post('/upload-signature', async (req, res) => {
  try {
    const signature = generateUploadSignature();
    const project = await Project.create({
      userId: req.userId,
      title: req.body.title || 'Untitled Project',
      clipDuration: req.body.clipDuration || 60,
      status: 'uploading',
    });
    res.json({ ...signature, projectId: project._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id/uploaded — called after Cloudinary upload completes
router.put('/:id/uploaded', async (req, res) => {
  try {
    const { cloudinaryUrl, cloudinaryPublicId, duration } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        originalVideoUrl: cloudinaryUrl,
        cloudinaryRawId: cloudinaryPublicId,
        duration,
        status: 'processing',
      },
      { returnDocument: 'after' }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // TODO: Push job to the Python worker queue here

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id — delete project and its clips
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Cleanup associated clips
    const Clip = require('../models/Clip');
    await Clip.deleteMany({ projectId: project._id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
