import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProject, getClips, updateClipStatus } from '../services/api';

function ScoreBar({ label, value }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-gray-400 w-8 text-right">{value}</span>
    </div>
  );
}

export default function ProjectView() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClip, setActiveClip] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([getProject(id), getClips(id)])
        .then(([projRes, clipRes]) => {
          setProject(projRes.data);
          setClips(clipRes.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    fetchData();

    // Auto-refresh when processing
    const interval = setInterval(() => {
      if (!project || ['uploading', 'processing', 'analyzing'].includes(project.status)) {
        fetchData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, project?.status]);

  const handleStatusChange = async (clipId, status) => {
    try {
      const { data } = await updateClipStatus(clipId, status);
      setClips((prev) => prev.map((c) => (c._id === clipId ? data : c)));
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-center text-gray-500 py-20">Project not found</p>;
  }

  const STATUS_LABELS = {
    uploading: { text: 'Uploading…', style: 'text-yellow-400' },
    processing: { text: 'AI is processing…', style: 'text-blue-400' },
    done: { text: 'Clips ready!', style: 'text-green-400' },
    failed: { text: 'Processing failed', style: 'text-red-400' },
  };

  const statusInfo = STATUS_LABELS[project.status] || {};

  return (
    <div>
      {/* ── Project Header ────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{project.title}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className={`text-sm font-medium ${statusInfo.style}`}>{statusInfo.text}</span>
          {project.duration && (
            <span className="text-sm text-gray-600">
              {Math.floor(project.duration / 60)}m {Math.floor(project.duration % 60)}s
            </span>
          )}
        </div>
      </div>

      {/* ── Processing State ──────────────────────────── */}
      {(project.status === 'processing' || project.status === 'analyzing') && (
        <div className="text-center py-16 rounded-2xl border border-blue-500/20 bg-blue-500/5 mb-8">
          <div className="w-12 h-12 mx-auto border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-blue-300 mb-2">
            {project.status === 'analyzing' ? 'AI Worker is Analyzing Content...' : 'Processing queued...'}
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Extracting audio, transcribing with Whisper, prompting GPT-4o-mini, and physically cropping to 9:16 and burning subtitles natively.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-xs text-blue-300 mb-2 font-medium">
              <span>Overall Progress</span>
              <span>{Math.round(project.progress || 0)}%</span>
            </div>
            <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Auto-refreshing live progress
            </p>
          </div>
        </div>
      )}

      {/* ── Clips Grid ────────────────────────────────── */}
      {clips.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Generated Clips ({clips.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {clips.map((clip) => (
              <div
                key={clip._id}
                className={`rounded-2xl bg-gray-900/60 border transition-all overflow-hidden ${
                  clip.status === 'approved'
                    ? 'border-green-500/30'
                    : clip.status === 'rejected'
                    ? 'border-red-500/20 opacity-60'
                    : 'border-gray-800/60 hover:border-purple-500/30'
                }`}
              >
                {/* Video preview */}
                {clip.cloudinaryClipId && (
                  <div className="aspect-video bg-gray-800">
                    <video
                      src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/${clip.cloudinaryClipId}.mp4`}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Score badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {clip.score}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">AI Score</p>
                        <p className="text-xs text-gray-400">
                          {clip.duration?.toFixed(0)}s clip
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        clip.status === 'approved'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : clip.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {clip.status}
                    </span>
                  </div>

                  {/* Text snippet */}
                  {clip.textSnippet && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                      "{clip.textSnippet}"
                    </p>
                  )}

                  {/* Score bars */}
                  <div className="space-y-2 mb-4">
                    <ScoreBar label="Hook" value={clip.metrics?.hook || 0} />
                    <ScoreBar label="Payoff" value={clip.metrics?.payoff || 0} />
                    <ScoreBar label="Pace" value={clip.metrics?.pace || 0} />
                    <ScoreBar label="Energy" value={clip.metrics?.audioEnergy || 0} />
                    <ScoreBar label="Completeness" value={clip.metrics?.completeness || 0} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(clip._id, 'approved')}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all cursor-pointer"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(clip._id, 'rejected')}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      ✕ Reject
                    </button>
                    {clip.cloudinaryClipId && (
                      <a
                        href={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/${clip.cloudinaryClipId}.mp4`}
                        download
                        className="py-2 px-4 rounded-lg text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                      >
                        ↓
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── No clips yet ──────────────────────────────── */}
      {project.status === 'done' && clips.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800">
          <div className="text-4xl mb-3">🤔</div>
          <p className="text-gray-500">No clips were generated. Try with a different video.</p>
        </div>
      )}
    </div>
  );
}
