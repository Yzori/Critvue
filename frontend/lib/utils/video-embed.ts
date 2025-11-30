/**
 * Video Embed Utilities
 *
 * Parses video URLs and returns embed information for:
 * - YouTube (youtube.com, youtu.be)
 * - Vimeo (vimeo.com)
 * - Twitch (clips.twitch.tv, twitch.tv/videos)
 * - Kick (kick.com clips and videos)
 * - Loom (loom.com)
 * - Direct video files (.mp4, .webm, .mov)
 */

export type VideoProvider = 'youtube' | 'vimeo' | 'twitch_clip' | 'twitch_video' | 'kick_clip' | 'kick_video' | 'loom' | 'direct' | null;

export interface VideoEmbed {
  provider: VideoProvider;
  videoId: string;
  embedUrl: string;
  thumbnailUrl?: string;
}

/**
 * Parse a URL and extract video embed information
 */
export function parseVideoUrl(url: string): VideoEmbed | null {
  if (!url) return null;

  const trimmedUrl = url.trim();

  // YouTube
  const youtubeMatch = trimmedUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      provider: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoMatch = trimmedUrl.match(
    /(?:vimeo\.com\/)(\d+)/
  );
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      provider: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
    };
  }

  // Twitch Clips
  const twitchClipMatch = trimmedUrl.match(
    /(?:clips\.twitch\.tv\/|twitch\.tv\/\w+\/clip\/)([a-zA-Z0-9_-]+)/
  );
  if (twitchClipMatch) {
    const clipId = twitchClipMatch[1];
    return {
      provider: 'twitch_clip',
      videoId: clipId,
      embedUrl: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`,
    };
  }

  // Twitch Videos
  const twitchVideoMatch = trimmedUrl.match(
    /twitch\.tv\/videos\/(\d+)/
  );
  if (twitchVideoMatch) {
    const videoId = twitchVideoMatch[1];
    return {
      provider: 'twitch_video',
      videoId,
      embedUrl: `https://player.twitch.tv/?video=${videoId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`,
    };
  }

  // Kick Clips (kick.com/username?clip=clipId or kick.com/clip/clipId)
  const kickClipMatch = trimmedUrl.match(
    /kick\.com\/(?:\w+\?clip=|clip\/)([a-zA-Z0-9_-]+)/
  );
  if (kickClipMatch) {
    const clipId = kickClipMatch[1];
    return {
      provider: 'kick_clip',
      videoId: clipId,
      embedUrl: `https://player.kick.com/clips/${clipId}`,
    };
  }

  // Kick Videos/VODs (kick.com/video/videoId)
  const kickVideoMatch = trimmedUrl.match(
    /kick\.com\/video\/([a-zA-Z0-9-]+)/
  );
  if (kickVideoMatch) {
    const videoId = kickVideoMatch[1];
    return {
      provider: 'kick_video',
      videoId,
      embedUrl: `https://player.kick.com/${videoId}`,
    };
  }

  // Loom
  const loomMatch = trimmedUrl.match(
    /(?:loom\.com\/share\/)([a-zA-Z0-9]+)/
  );
  if (loomMatch) {
    const videoId = loomMatch[1];
    return {
      provider: 'loom',
      videoId,
      embedUrl: `https://www.loom.com/embed/${videoId}`,
    };
  }

  // Direct video files
  const directVideoMatch = trimmedUrl.match(
    /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i
  );
  if (directVideoMatch) {
    return {
      provider: 'direct',
      videoId: trimmedUrl,
      embedUrl: trimmedUrl,
    };
  }

  return null;
}

/**
 * Check if a URL is a video URL
 */
export function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

/**
 * Check if content type is video-related
 */
export function isVideoContentType(contentType: string): boolean {
  const videoTypes = ['video', 'streaming', 'animation', 'motion'];
  return videoTypes.some(type => contentType.toLowerCase().includes(type));
}

/**
 * Get provider display name
 */
export function getProviderName(provider: VideoProvider): string {
  switch (provider) {
    case 'youtube': return 'YouTube';
    case 'vimeo': return 'Vimeo';
    case 'twitch_clip': return 'Twitch Clip';
    case 'twitch_video': return 'Twitch Video';
    case 'kick_clip': return 'Kick Clip';
    case 'kick_video': return 'Kick Video';
    case 'loom': return 'Loom';
    case 'direct': return 'Video';
    default: return 'Video';
  }
}
