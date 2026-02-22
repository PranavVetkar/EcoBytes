from app.config import settings
import os

print(f"Current Working Directory: {os.getcwd()}")
print(f"Cloud Name in Settings: {settings.cloudinary_cloud_name}")
print(f"API Key in Settings: {settings.cloudinary_api_key}")
print(f"API Secret in Settings: {'Set' if settings.cloudinary_api_secret else 'Not Set'}")

# Check if os.getenv works too
print(f"Cloud Name in os.getenv: {os.getenv('CLOUDINARY_CLOUD_NAME')}")
