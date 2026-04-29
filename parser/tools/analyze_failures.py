import os
import sys
import io
from PIL import Image

# Set paths
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.abspath(os.path.join(current_dir, '..', 'src'))
sys.path.append(src_dir)
sys.path.append(current_dir)

from image_optimizer import analyze_color_distribution, test_thresholds

def run_analysis(img_path):
    print(f"\n{'='*60}")
    print(f"ANALYZING: {img_path}")
    print(f"{'='*60}")
    if not os.path.exists(img_path):
        print(f"File {img_path} not found")
        return
    with open(img_path, "rb") as f:
        img_bytes = f.read()
    
    print("\n[1] Color Distribution:")
    analyze_color_distribution(img_bytes)
    
    print("\n[2] Threshold Testing:")
    test_thresholds(img_bytes)

if __name__ == "__main__":
    failed = [
        "SvitloSk/parser/tests/vision_cases/images/20260401_205112.png",
        "SvitloSk/parser/tests/vision_cases/images/hist_2003_20260408_200608.png"
    ]
    success = [
        "SvitloSk/parser/tests/vision_cases/images/20260402_225212.png",
        "SvitloSk/parser/tests/vision_cases/images/hist_0304_20260408_221114.png"
    ]
    
    print(">>> STARTING FAILURE ANALYSIS <<<")
    for f in failed: run_analysis(f)
    
    print("\n\n>>> STARTING SUCCESS ANALYSIS <<<")
    for f in success: run_analysis(f)
