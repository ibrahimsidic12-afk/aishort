"use client";

import { useState } from "react";
import { UploadForm } from "@/components/forms/upload-form";
import { JobStatusTracker } from "@/components/common/job-status-tracker";

export default function UploadsPage() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Video</h1>
        <p className="text-muted-foreground">
          Upload a video to start generating clips with AI.
        </p>
      </div>

      {/* Upload Form */}
      <UploadForm
        onUploadComplete={(videoId, jobId) => {
          setActiveJobId(jobId);
        }}
      />

      {/* Active Job Tracker */}
      {activeJobId && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Processing Status</h2>
          <JobStatusTracker
            jobId={activeJobId}
            onComplete={() => {
              // Could auto-navigate or show generation prompt
            }}
          />
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border p-6 bg-secondary/30">
        <h3 className="font-semibold">Tips for best results</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Upload videos with clear audio for better transcription</li>
          <li>• Longer videos (10+ minutes) yield more clip candidates</li>
          <li>• Supported formats: MP4, MOV, WEBM (up to 2GB)</li>
          <li>• Processing takes 2-5 minutes depending on video length</li>
        </ul>
      </div>
    </div>
  );
}
