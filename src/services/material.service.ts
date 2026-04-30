import { Readable } from 'stream';
import cloudinary   from '../config/cloudinary';
import {
  createMaterial,
  findMaterialById,
  listMaterialsByCourse,
  deleteMaterial,
} from '../models/material.model';
import { findCourseById } from '../models/course.model';
import {
  OfflineMaterial,
  UploadMaterialBody,
  mimeToFileType,
  fileTypeToCloudinaryResource,
} from '../types/material.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors';

// ─── Helper: upload buffer to Cloudinary ─────────────────────
// Converts multer memory buffer into a stream
// then pipes it to Cloudinary upload API
const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: 'video' | 'raw' | 'image'
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id:  result.public_id,
        });
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ─── Helper: verify course ownership ─────────────────────────
const verifyCourseOwnership = async (
  course_id: number,
  user: JwtPayload
): Promise<void> => {
  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');

  const isAdmin   = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;
  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only manage materials in your own courses');
  }
};

// ─── UPLOAD ───────────────────────────────────────────────────
export const uploadMaterialService = async (
  course_id: number,
  body: UploadMaterialBody,
  file: Express.Multer.File,
  user: JwtPayload
): Promise<OfflineMaterial> => {

  await verifyCourseOwnership(course_id, user);

  // Detect file type from MIME — more reliable than trusting client
  const file_type    = mimeToFileType(file.mimetype);
  const resourceType = fileTypeToCloudinaryResource(file_type);

  // Upload to Cloudinary
  // Folder structure: digital-essentials/courses/{course_id}
  const { secure_url, public_id } = await uploadToCloudinary(
    file.buffer,
    `digital-essentials/courses/${course_id}`,
    resourceType
  );

  // Save to database — only URL and public_id, not the file
  const material_id = await createMaterial({
    course_id,
    lesson_id:            body.lesson_id ? parseInt(body.lesson_id, 10) : null,
    title:                body.title,
    file_url:             secure_url,
    cloudinary_public_id: public_id,
    file_type,
    is_downloadable:      body.is_downloadable === 'true',
  });

  const material = await findMaterialById(material_id);
  return material!;
};

// ─── LIST ─────────────────────────────────────────────────────
export const listMaterialsService = async (
  course_id: number
): Promise<OfflineMaterial[]> => {
  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');
  return listMaterialsByCourse(course_id);
};

// ─── GET ONE ──────────────────────────────────────────────────
export const getMaterialService = async (
  material_id: number
): Promise<OfflineMaterial> => {
  const material = await findMaterialById(material_id);
  if (!material) throw new NotFoundError('Material not found');
  return material;
};

// ─── DELETE ───────────────────────────────────────────────────
// Deletes from BOTH Cloudinary and MySQL
export const deleteMaterialService = async (
  material_id: number,
  user: JwtPayload
): Promise<void> => {

  const material = await findMaterialById(material_id);
  if (!material) throw new NotFoundError('Material not found');

  await verifyCourseOwnership(material.course_id, user);

  // Delete from Cloudinary first
  // resource_type must match what was used during upload
  const resourceType = fileTypeToCloudinaryResource(material.file_type);
  await cloudinary.uploader.destroy(material.cloudinary_public_id, {
    resource_type: resourceType,
  });

  // Then delete from MySQL
  await deleteMaterial(material_id);
};