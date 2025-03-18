import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Camera } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

interface PhotoUploaderProps {
  profileImage?: string;
  additionalPhotos?: string[];
  onPhotoUploaded?: (url: string, isProfilePhoto: boolean) => void;
  onPhotoDeleted?: (url: string, isProfilePhoto: boolean) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  profileImage = "",
  additionalPhotos = [],
  onPhotoUploaded,
  onPhotoDeleted,
  maxPhotos = 10,
  disabled = false,
}) => {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"profile" | "additional">(
    "profile"
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string>("");

  useEffect(() => {
    setMainPhoto(profileImage || "");
    setPhotos(additionalPhotos || []);
  }, [profileImage, additionalPhotos]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isProfilePhoto: boolean
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Handle multiple files for additional photos
    const filesToUpload = isProfilePhoto ? [files[0]] : Array.from(files);

    for (const file of filesToUpload) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        continue;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image`);
        continue;
      }

      setIsUploading(true);
      setUploadType(isProfilePhoto ? "profile" : "additional");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("isProfilePhoto", isProfilePhoto.toString());

        // Get token from localStorage if available
        const authToken = localStorage.getItem("authToken");
        const headers: HeadersInit = {};

        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch("/api/user/photos", {
          method: "POST",
          credentials: "include", // Include cookies for session authentication
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || `Failed to upload photo (${response.status})`
          );
        }

        const data = await response.json();

        // Update local state
        if (isProfilePhoto) {
          setMainPhoto(data.url);
        } else {
          setPhotos((prev) => [...prev, data.url]);
        }

        // Notify parent component
        if (onPhotoUploaded) {
          onPhotoUploaded(data.url, isProfilePhoto);
        }

        toast.success(`Photo ${file.name} uploaded successfully`);
      } catch (error: any) {
        toast.error(error.message || `Failed to upload photo ${file.name}`);
        console.error("Photo upload error:", error);
      }
    }

    setIsUploading(false);
    // Clear the file input
    event.target.value = "";
  };

  const handleDeletePhoto = async (url: string, isProfilePhoto: boolean) => {
    if (!url) return;

    try {
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/user/photos", {
        method: "DELETE",
        headers,
        credentials: "include",
        body: JSON.stringify({ photoUrl: url, isProfilePhoto }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `Failed to delete photo (${response.status})`
        );
      }

      // Update local state
      if (isProfilePhoto) {
        setMainPhoto("");
      } else {
        setPhotos((prev) => prev.filter((photo) => photo !== url));
      }

      // Notify parent component
      if (onPhotoDeleted) {
        onPhotoDeleted(url, isProfilePhoto);
      }

      toast.success("Photo deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete photo");
      console.error("Photo delete error:", error);
    }
  };

  const handleProfilePhotoClick = () => {
    const input = document.getElementById("profile-photo");
    if (input) {
      input.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
            {mainPhoto ? (
              <>
                <Image
                  src={mainPhoto}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(mainPhoto, true)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 z-10"
                  disabled={disabled || isUploading}
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera size={32} className="text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleProfilePhotoClick}
              disabled={disabled || isUploading}
              className="cursor-pointer"
            >
              {isUploading && uploadType === "profile" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Profile Photo
            </Button>
            <Input
              id="profile-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, true)}
              disabled={disabled || isUploading}
              key={mainPhoto} // Force re-render of input
            />
            <p className="text-sm text-gray-500 mt-1">
              This will be your main photo
            </p>
          </div>
        </div>
      </div>

      {/* Additional Photos Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Additional Photos</h3>
        <p className="text-sm text-gray-500 mb-4">
          You can upload up to {maxPhotos - 1} additional photos. Currently{" "}
          {photos.length}/{maxPhotos - 1}
        </p>

        <div className="grid grid-cols-3 gap-4">
          {/* Existing Photos */}
          {photos.map((photo, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0 relative h-40">
                <Image
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo, false)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-10"
                  disabled={disabled || isUploading}
                >
                  <X size={16} />
                </button>
              </CardContent>
            </Card>
          ))}

          {/* Upload New Photo Card (only show if under limit) */}
          {photos.length < maxPhotos - 1 && (
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative h-40 flex items-center justify-center">
                <Label
                  htmlFor="additional-photo"
                  className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                >
                  {isUploading && uploadType === "additional" ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Upload Photos
                      </span>
                    </>
                  )}
                </Label>
                <Input
                  id="additional-photo"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e, false)}
                  disabled={disabled || isUploading}
                  key={`additional-${photos.length}`} // Force re-render of input
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoUploader;
