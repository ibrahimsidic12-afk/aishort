export type CaptionSegment = {
  start: number;
  end: number;
  text: string;
  words?: Record<string, unknown>[];
};
export type CaptionStyle = Record<string, unknown>;
export type CaptionData = {
  segments: CaptionSegment[];
  style: CaptionStyle;
};

export type CaptionResponse = {
  clipId: string;
  segments: CaptionSegment[];
  format: string;
  language: string;
};

export async function getCaptions(input: {
  clipId: string;
}): Promise<CaptionResponse> {
  console.warn("[CAPTIONS] getCaptions: stub");
  return {
    clipId: input.clipId,
    segments: [],
    format: "srt",
    language: "en",
  };
}

export async function updateCaptions(input: {
  clipId: string;
  captions: CaptionData;
}): Promise<{ clipId: string; segments: CaptionSegment[]; updatedAt: Date }> {
  console.warn("[CAPTIONS] updateCaptions: stub");
  return {
    clipId: input.clipId,
    segments: input.captions.segments,
    updatedAt: new Date(),
  };
}
