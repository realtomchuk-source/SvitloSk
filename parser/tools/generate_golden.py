import os
import sys
import json

# Add src to path to find modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from modules.grid_vision import parse_grid_from_image

def generate_initial_golden_set(images_dir, golden_dir):
    """
    Runs the current parser on images and saves the results as initial golden files.
    """
    os.makedirs(golden_dir, exist_ok=True)
    files = [f for f in os.listdir(images_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    count = 0
    for filename in files:
        img_path = os.path.join(images_dir, filename)
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        
        result = parse_grid_from_image(img_bytes)
        
        if result:
            json_filename = os.path.splitext(filename)[0] + ".json"
            with open(os.path.join(golden_dir, json_filename), "w", encoding="utf-8") as jf:
                json.dump(result, jf, indent=4)
            count += 1
            print(f"Generated golden JSON for {filename}")
        else:
            print(f"Parser failed for {filename}, skipping.")

    print(f"\nSuccessfully generated {count} golden files out of {len(files)}.")

if __name__ == "__main__":
    IMAGES = "SvitloSk/parser/tests/vision_cases/images"
    GOLDEN = "SvitloSk/parser/tests/vision_cases/golden"
    generate_initial_golden_set(IMAGES, GOLDEN)
