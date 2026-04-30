export type FileType = 'pdf' | 'audio' | 'video' | 'worksheet';

export interface OfflineMaterial {
  material_id:          number;
  course_id:            number;
  lesson_id:            number | null;
  title:                string;
  file_url:             string;
  cloudinary_public_id: string;
  file_type:            FileType;
  is_downloadable:      boolean;
  created_at:           Date;
}

// What client sends when uploading
// file comes via multipart — not in body
export interface UploadMaterialBody {
  title:           string;
  file_type:       FileType;
  lesson_id?:      string;   // optional — string because it comes from form-data
  is_downloadable?: string;  // 'true' or 'false' — string from form-data
}

// Map MIME type to your FileType enum
export const mimeToFileType = (mime: string): FileType => {
  if (mime === 'application/pdf')                    return 'pdf';
  if (mime.startsWith('audio/'))                     return 'audio';
  if (mime.startsWith('video/'))                     return 'video';
  return 'worksheet';
};

// Map FileType to Cloudinary resource type
// Cloudinary needs to know how to process the file
export const fileTypeToCloudinaryResource = (
  fileType: FileType
): 'image' | 'video' | 'raw' => {
  if (fileType === 'video')              return 'video';
  if (fileType === 'audio')             return 'video'; // Cloudinary handles audio as video
  return 'raw';                                         // PDF and worksheet = raw
};