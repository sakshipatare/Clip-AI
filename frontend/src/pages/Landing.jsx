import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="flex flex-col items-center pt-20 pb-16">
      {/* ── Hero ──────────────────────────────────────── */}
      <div className="relative mb-8">
        <div className="absolute -inset-20 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-transparent rounded-full blur-3xl" />
        <h1 className="relative text-6xl md:text-7xl font-bold leading-tight text-center">
          <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Turn Long Videos
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Into Viral Clips
          </span>
        </h1>
      </div>

      <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-10 leading-relaxed">
        Upload a podcast, interview, or webinar. Our AI finds the
        <span className="text-purple-300 font-medium"> best moments</span>,
        cuts them into short clips, adds subtitles, and formats them for
        TikTok, Reels & Shorts —{' '}
        <span className="text-pink-300 font-medium">automatically</span>.
      </p>

      <div className="flex gap-4 mb-20">
        <Link
          to="/register"
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:-translate-y-0.5"
        >
          Start for Free
        </Link>
        <Link
          to="/login"
          className="px-8 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-lg transition-all hover:-translate-y-0.5"
        >
          Sign In
        </Link>
      </div>

      {/* ── Feature Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          {
            icon: '🎯',
            title: 'Smart Detection',
            desc: 'AI finds the most engaging moments using hook strength, pacing, and audio energy scoring.',
          },
          {
            icon: '📱',
            title: 'Social-Ready',
            desc: 'Auto-crops to 9:16 vertical, adds animated subtitles, ready for TikTok, Reels & Shorts.',
          },
          {
            icon: '⚡',
            title: 'Instant Clips',
            desc: 'Upload once, get multiple clips ranked by engagement score. Review, approve, and download.',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800/60 hover:border-purple-500/30 transition-all group"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
              {f.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
