export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Branding panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 gradient-bg" />
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">AI Clipper</span>
          </div>

          {/* Testimonial / Feature */}
          <div className="max-w-md space-y-6">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Turn long videos into viral short-form content
            </h2>
            <p className="text-base leading-relaxed text-white/80">
              AI-powered clip detection finds the most engaging moments in your videos. Auto-generate captions, score virality, and publish everywhere.
            </p>
            {/* Feature highlights */}
            <div className="space-y-3">
              {[
                "AI detects viral moments automatically",
                "One-click publish to TikTok, YouTube & Reels",
                "Animated captions & smart thumbnails",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="space-y-3">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-[10px] font-bold text-white backdrop-blur-sm"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/70">
              Trusted by 2,000+ content creators worldwide
            </p>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute -right-20 top-20 h-60 w-60 rounded-full bg-white/5" />
        <div className="absolute -left-10 bottom-20 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-40 h-20 w-20 rounded-full bg-white/10" />
      </div>

      {/* Right: Auth form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[400px] animate-fade-in-up">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </div>
            <span className="text-lg font-bold gradient-text">AI Clipper</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
