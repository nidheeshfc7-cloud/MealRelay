# MealRelay — Cinematic Video Asset Integration

## Asset Destination
```
mobile/assets/videos/mealrelay-impact.mp4
```

## Recommended Video Specifications (Google Veo / Runway / Sora)
- **Aspect Ratio:** `9:16` (Vertical/Portrait)
- **Resolution:** `1080 x 1920` (or `720 x 1280` minimum)
- **Duration:** 3.5 to 4.5 seconds
- **Frame Rate:** 30fps or 60fps
- **Codec:** H.264 / AAC (MP4 container)
- **Audio:** Muted or subtle low-frequency atmospheric rumble

## Recommended Google Veo Prompt
> "Cinematic macro commercial slow-motion shot: a single freshly washed, glistening deep-crimson heirloom tomato drops onto a dark, wet slate surface in ultra slow motion. Authentic, physically accurate water droplets spray outward on impact, catching soft directional studio light. Ultra shallow depth of field, chiaroscuro lighting, luxury dark food advertising aesthetic, 4K photorealistic."

## Integration Steps
1. Render the video and copy the MP4 file to:
   `MealRelayMini/mobile/assets/videos/mealrelay-impact.mp4`
2. Open `src/intro/videoSource.ts` and set:
   ```ts
   export const HAS_CINEMATIC_VIDEO = true;
   ```
3. Restart Expo with clear cache:
   ```bash
   npx expo start -c
   ```

## Fallback Mechanism
If `HAS_CINEMATIC_VIDEO` is `false`, the intro automatically activates the ultra-clean photorealistic still shot with an optical camera push-in (`assets/images/mealrelay-impact-still.jpg`). No cartoon or beginner SVG effects are ever rendered.
