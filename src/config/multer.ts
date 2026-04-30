// src/config/multer.ts
// multer stores file in memory — we send it straight to Cloudinary
// never touches the disk

import multer from 'multer';

const ALLOWED_MIME_TYPES = [
  'application/pdf',                // PDF
  'audio/mpeg',                     // MP3
  'audio/mp4',                      // M4A
  'audio/wav',                      // WAV
  'video/mp4',                      // MP4
  'video/quicktime',                // MOV
  'application/vnd.openxmlformats-officedocument'
  + '.wordprocessingml.document',   // DOCX worksheet
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(
        `File type not allowed. Allowed types: PDF, MP3, WAV, MP4, MOV, DOCX`
      ));
    }
  },
});
