import os
import io
import logging
from PIL import Image
from modules.grid_vision import is_outage_color, is_dark_pixel

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("ImageOptimizer")

def analyze_color_distribution(img_bytes):
    """Analyzes the RGB distribution of an image to help find the best thresholds."""
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    w, h = img.size
    
    colors = {}
    # Sample every 5th pixel to save time
    for x in range(0, w, 5):
        for y in range(0, h, 5):
            rgb = img.getpixel((x, y))
            # Group colors slightly to find patterns
            rounded_rgb = tuple((c // 10) * 10 for c in rgb)
            colors[rounded_rgb] = colors.get(rounded_rgb, 0) + 1
    
    # Sort by frequency
    sorted_colors = sorted(colors.items(), key=lambda x: x[1], reverse=True)
    
    logger.info("\nTop 10 Most Frequent Colors (Approximate):")
    for rgb, count in sorted_colors[:10]:
        logger.info(f"RGB {rgb}: {count} pixels")

def test_thresholds(img_bytes, dark_threshold=650, outage_blue_min=130):
    """
    Tests how many pixels are marked as 'outage' or 'dark' with given thresholds.
    Used to tune config.py.
    """
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    w, h = img.size
    
    dark_count = 0
    outage_count = 0
    total = w * h
    
    for x in range(w):
        for y in range(h):
            rgb = img.getpixel((x, y))
            if sum(rgb) < dark_threshold:
                dark_count += 1
            
            # Simplified check based on our is_outage_color logic
            r, g, b = rgb
            if b > outage_blue_min and b > r + 15:
                outage_count += 1
                
    logger.info(f"Results for DarkThresh={dark_threshold}, BlueMin={outage_blue_min}:")
    logger.info(f"  Dark pixels: {dark_count} ({dark_count/total:.2%})")
    logger.info(f"  Potential Outage pixels: {outage_count} ({outage_count/total:.2%})")

if __name__ == "__main__":
    # Example usage
    IMAGE_PATH = "SvitloSk/parser/data/raw_site/sample.png" 
    if os.path.exists(IMAGE_PATH):
        with open(IMAGE_PATH, "rb") as f:
            img_bytes = f.read()
        
        analyze_color_distribution(img_bytes)
        test_thresholds(img_bytes)
    else:
        logger.error(f"Sample image not found at {IMAGE_PATH}")
