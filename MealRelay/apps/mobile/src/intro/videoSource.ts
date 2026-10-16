/**
 * MEALRELAY CINEMATIC INTRO — ASSET INTEGRATION POINT
 *
 * This module manages the integration of the pre-rendered cinematic vegetable impact video.
 *
 * HOW TO ADD YOUR GOOGLE VEO VIDEO:
 * 1. Generate your cinematic video (e.g. in Google Veo, Sora, or Runway):
 *    - Prompt: "Extreme slow-motion macro shot of a freshly washed red heirloom tomato falling onto a wet dark slate surface, physically accurate water splash reflecting studio lights, dark moody chiaroscuro lighting, shallow depth of field, 4k 60fps."
 *    - Orientation: Portrait (9:16 or 1080x1920).
 *    - Duration: ~4 seconds.
 * 2. Save the rendered MP4 file to:
 *    mobile/assets/videos/mealrelay-impact.mp4
 * 3. Change HAS_CINEMATIC_VIDEO to true below.
 * 4. Restart Expo with clear cache:
 *    npx expo start -c
 *
 * FALLBACK BEHAVIOR:
 * When HAS_CINEMATIC_VIDEO is false (or while awaiting the video asset),
 * the app seamlessly displays a photorealistic commercial macro photograph
 * (assets/images/mealrelay-impact-still.jpg) with a subtle cinematic camera push-in.
 * NO cartoon droplets, NO fake shapes, NO crude physics.
 */

export const HAS_CINEMATIC_VIDEO = false;

// Pre-configured asset references
export const CINEMATIC_VIDEO_ASSET = HAS_CINEMATIC_VIDEO
  ? require('../../assets/videos/mealrelay-impact.mp4')
  : null;

export const CINEMATIC_STILL_ASSET = require('../../assets/images/mealrelay-impact-still.jpg');
