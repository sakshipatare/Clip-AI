import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, deleteProject } from '../services/api';

const STATUS_STYLES = {
  uploading: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  done: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(({ data }) => setProjects(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p._id !== id));
    } catch {
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Projects</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projects.length} project{projects.length !== 1 && 's'}
          </p>
        </div>
        <Link
          to="/upload"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-medium shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
        >
          + Upload Video
        </Link>
      </div>

      {/* ── Empty State ─────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-gray-800">
          <div className="text-5xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Upload your first video to get started</p>
          <Link
            to="/upload"
            className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-medium"
          >
            Upload Video
          </Link>
        </div>
      ) : (
        /* ── Project Grid ──────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <Link
              key={p._id}
              to={`/project/${p._id}`}
              className="group p-5 rounded-2xl bg-gray-900/60 border border-gray-800/60 hover:border-purple-500/30 transition-all hover:-translate-y-0.5"
            >
              {/* Thumbnail placeholder */}
              <div className="h-36 rounded-xl bg-gray-800/80 mb-4 flex items-center justify-center overflow-hidden">
                {p.originalVideoUrl ? (
                  <video
                    src={p.originalVideoUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <span className="text-4xl">🎥</span>
                )}
              </div>

              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                {p.title}
              </h3>

              <div className="flex items-center justify-between mt-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[p.status] || ''}`}
                >
                  {p.status}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, p._id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete Project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
