import os
import base64
import json
from pathlib import Path
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

# Load .env
env_path = Path(".") / ".env"
load_dotenv(dotenv_path=env_path)

cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

print(f"Cloud Name: {cloud_name}")
print(f"API Key: {api_key}")
print(f"API Secret: {'*' * len(api_secret) if api_secret else 'None'}")

if not all([cloud_name, api_key, api_secret]):
    print("ERROR: Missing Cloudinary credentials in .env")
    exit(1)

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True
)

try:
    print("Attempting to ping Cloudinary...")
    # Just try to fetch an empty list or something simple
    # Or better, upload a tiny dummy file
    dummy_image = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
    result = cloudinary.uploader.upload(dummy_image, folder="test_diagnostics")
    print("SUCCESS: Cloudinary upload worked!")
    print(f"URL: {result.get('secure_url')}")
except Exception as e:
    print(f"FAILED: {e}")
