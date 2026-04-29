import os
import json
import logging
from modules.grid_vision import parse_grid_from_image
from modules.utils import load_json

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("VisionValidator")

def validate_vision_set(images_dir, golden_dir):
    """
    Validates the current vision parser against a golden set of images and expected results.
    """
    results = []
    files = [f for f in os.listdir(images_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    if not files:
        logger.error(f"No images found in {images_dir}")
        return

    logger.info(f"Found {len(files)} images. Starting validation...")

    for filename in files:
        img_path = os.path.join(images_dir, filename)
        # Expected result file: image.png -> image.json
        json_filename = os.path.splitext(filename)[0] + ".json"
        json_path = os.path.join(golden_dir, json_filename)

        if not os.path.exists(json_path):
            logger.warning(f"Skipping {filename}: No golden JSON found at {json_//path}")
            continue

        with open(img_path, "rb") as f:
            img_bytes = f.read()
        
        expected = load_json(json_path)
        actual = parse_grid_from_image(img_bytes)

        if actual is None:
            results.append({"file": filename, "status": "FAILED", "error": "Parser returned None"})
            continue

        # Compare 12 queues
        errors = []
        for q, bits in expected.items():
            if q not in actual:
                errors.append(f"Queue {q} missing")
                continue
            if actual[q] != bits:
                errors.append(f"Queue {q}: expected {bits}, got {actual[q]}")

        if not errors:
            results.append({"file": filename, "status": "PASSED"})
        else:
            results.append({"file": filename, "status": "FAILED", "errors": errors})

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASSED")
    failed = len(results) - passed
    logger.info("\n" + "="*30)
    logger.info(f"VALIDATION SUMMARY")
    logger.info(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}")
    logger.info("="*30)

    for r in results:
        if r["status"] == "FAILED":
            logger.error(f"❌ {r['file']}: {r.get('error', '')} {r.get('errors', '')}")
        else:
            logger.info(f"✅ {r['file']}")

if __name__ == "__main__":
    # Example usage
    IMAGES = "SvitloSk/parser/tests/vision_cases/images"
    GOLDEN = "SvitloSk/parser/tests/vision_cases/golden"
    validate_vision_set(IMAGES, GOLDEN)
