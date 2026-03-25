import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUploadSignature, markUploaded } from '../services/api';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [clipDuration, setClipDuration] = useState(60);
  const fileRef = useRef();
  const navigate = useNavigate();

  const DURATION_OPTIONS = [
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '1m 30s', value: 90 },
    { label: '2m', value: 120 },
    { label: '2m 30s', value: 150 },
    { label: '3m', value: 180 },
  ];

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('Please upload a video file');
      return;
    }
    setError('');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // 1. Get signed upload params from our API
      const { data: sig } = await getUploadSignature(title, clipDuration);

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.apiKey);
      formData.append('timestamp', sig.timestamp);
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      const cloudResult = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error('Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      // 3. Tell our backend the upload completed
      await markUploaded(sig.projectId, {
        cloudinaryUrl: cloudResult.secure_url,
        cloudinaryPublicId: cloudResult.public_id,
        duration: cloudResult.duration,
      });

      navigate(`/project/${sig.projectId}`);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
      <p className="text-gray-500 mb-8">Upload a long-form video to generate AI clips</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Title ────────────────────────────────────── */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1.5">Project Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Podcast Episode"
          className="w-full px-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-700/60 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
        />
      </div>

      {/* ── Clip Duration ────────────────────────────── */}
      <div className="mb-8">
        <label className="block text-sm text-gray-400 mb-3">Target Clip Duration</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setClipDuration(opt.value)}
              className={`py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                clipDuration === opt.value
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                  : 'bg-gray-800/40 border-gray-700/60 text-gray-500 hover:border-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Drop Zone ────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          dragOver
            ? 'border-purple-500 bg-purple-500/5'
            : file
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />
        {file ? (
          <>
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-gray-500 text-sm mt-1">
              {(file.size / (1024 * 1024)).toFixed(1)} MB • Click to change
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-300 font-medium">Drop a video file here</p>
            <p className="text-gray-600 text-sm mt-1">or click to browse • MP4, MOV, AVI</p>
          </>
        )}
      </div>

      {/* ── Progress Bar ─────────────────────────────── */}
      {uploading && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────── */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xl shadow-purple-500/20"
      >
        {uploading ? `Uploading… ${progress}%` : 'Upload & Process'}
      </button>
    </div>
  );
}
