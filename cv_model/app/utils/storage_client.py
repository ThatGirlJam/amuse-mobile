"""
Supabase Storage Client

Handles uploading annotated images to Supabase Storage
"""

import os
import uuid
from typing import Optional, Dict
from datetime import datetime


class StorageClient:
    """Client for Supabase Storage operations"""

    def __init__(self):
        """Initialize the storage client"""
        try:
            from supabase import create_client, Client
            self.supabase_module = True
        except ImportError:
            print("Warning: supabase-py not installed. Storage uploads will be disabled.")
            print("Install with: pip install supabase")
            self.supabase_module = False
            return

        # Get Supabase credentials from environment
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            print("Warning: Supabase credentials not found in environment")
            print("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
            self.client = None
            return

        # Create Supabase client
        self.client: Client = create_client(supabase_url, supabase_key)
        self.bucket_name = "annotated-pictures"

    def upload_annotated_image(
        self,
        image_bytes: bytes,
        analysis_id: Optional[str] = None,
        file_extension: str = "png"
    ) -> Optional[Dict]:
        """
        Upload an annotated image to Supabase Storage

        Args:
            image_bytes: The image data as bytes
            analysis_id: Optional analysis ID to associate with the image
            file_extension: File extension (default: png)

        Returns:
            Dictionary with upload result or None if failed
        """
        if not self.supabase_module or not self.client:
            print("Supabase client not initialized. Skipping upload.")
            return None

        try:
            # Generate unique filename
            if analysis_id:
                filename = f"{analysis_id}_annotated.{file_extension}"
            else:
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                unique_id = str(uuid.uuid4())[:8]
                filename = f"annotated_{timestamp}_{unique_id}.{file_extension}"

            # Determine content type
            content_type = "image/png" if file_extension == "png" else "image/jpeg"

            # Upload to Supabase Storage
            response = self.client.storage.from_(self.bucket_name).upload(
                path=filename,
                file=image_bytes,
                file_options={"content-type": content_type}
            )

            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(filename)

            return {
                "success": True,
                "filename": filename,
                "public_url": public_url,
                "bucket": self.bucket_name,
                "path": filename
            }

        except Exception as e:
            print(f"Error uploading to Supabase Storage: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def delete_annotated_image(self, filename: str) -> bool:
        """
        Delete an annotated image from Supabase Storage

        Args:
            filename: The filename to delete

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase_module or not self.client:
            print("Supabase client not initialized. Cannot delete.")
            return False

        try:
            self.client.storage.from_(self.bucket_name).remove([filename])
            return True

        except Exception as e:
            print(f"Error deleting from Supabase Storage: {str(e)}")
            return False

    def get_public_url(self, filename: str) -> Optional[str]:
        """
        Get the public URL for an uploaded file

        Args:
            filename: The filename in the bucket

        Returns:
            Public URL string or None if failed
        """
        if not self.supabase_module or not self.client:
            return None

        try:
            return self.client.storage.from_(self.bucket_name).get_public_url(filename)
        except Exception as e:
            print(f"Error getting public URL: {str(e)}")
            return None

    def check_bucket_exists(self) -> bool:
        """
        Check if the annotated-pictures bucket exists

        Returns:
            True if bucket exists, False otherwise
        """
        if not self.supabase_module or not self.client:
            return False

        try:
            buckets = self.client.storage.list_buckets()
            return any(bucket.name == self.bucket_name for bucket in buckets)
        except Exception as e:
            print(f"Error checking bucket: {str(e)}")
            return False
