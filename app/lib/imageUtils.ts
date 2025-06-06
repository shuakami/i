import type { ColorPalette } from "../types";

export function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({
          primary: "rgba(0, 0, 0, 0.4)",
          secondary: "rgba(0, 0, 0, 0.3)",
          text: "white",
          textSecondary: "rgba(255, 255, 255, 0.9)",
          isDark: true,
        });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const centerX = Math.floor(img.width / 2);
      const centerY = Math.floor(img.height / 2);
      const sampleSize = 50; // Sample a 100x100 area from the center

      let r = 0,
        g = 0,
        b = 0,
        count = 0;

      // Iterate over a smaller region or with a larger step for performance
      for (let x = Math.max(0, centerX - sampleSize); x < Math.min(img.width, centerX + sampleSize); x += 5) {
        for (let y = Math.max(0, centerY - sampleSize); y < Math.min(img.height, centerY + sampleSize); y += 5) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          r += pixel[0];
          g += pixel[1];
          b += pixel[2];
          count++;
        }
      }
      
      if (count === 0) { // Fallback if the image is smaller than sample area or other issues
         resolve({
          primary: "rgba(0, 0, 0, 0.4)",
          secondary: "rgba(0, 0, 0, 0.3)",
          text: "white",
          textSecondary: "rgba(255, 255, 255, 0.9)",
          isDark: true,
        });
        return;
      }

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const isDark = brightness < 128;

      resolve({
        primary: `rgba(${r}, ${g}, ${b}, 0.4)`,
        secondary: `rgba(${r}, ${g}, ${b}, 0.3)`,
        text: isDark ? "white" : "black",
        textSecondary: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
        isDark,
      });
    };

    img.onerror = () => {
      // Fallback colors on error
      resolve({
        primary: "rgba(0, 0, 0, 0.4)",
        secondary: "rgba(0, 0, 0, 0.3)",
        text: "white",
        textSecondary: "rgba(255, 255, 255, 0.9)",
        isDark: true,
      });
    };

    img.src = imageUrl;
  });
} 