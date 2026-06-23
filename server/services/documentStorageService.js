import { Readable } from 'node:stream'

import { assertCloudinaryConfigured, cloudinary } from '../config/cloudinary.js'

const folder = process.env.CLOUDINARY_DOCUMENT_FOLDER ?? 'nexus/student-documents'

export function uploadDocumentToCloudinary(file, metadata) {
  assertCloudinaryConfigured()

  const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw'

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        access_mode: 'public',
        context: {
          category: metadata.category,
          register_number: metadata.registerNumber || '',
          student_name: metadata.studentName || '',
        },
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'))
          return
        }

        resolve({
          assetId: result.asset_id,
          publicId: result.public_id,
          secureUrl: result.secure_url,
          resourceType,
        })
      },
    )

    Readable.from(file.buffer).pipe(uploadStream)
  })
}

export async function deleteDocumentFromCloudinary(publicId, resourceType) {
  assertCloudinaryConfigured()

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  })
}

export function buildDownloadUrl(publicId, resourceType, originalName) {
  assertCloudinaryConfigured()

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    flags: 'attachment',
    attachment: originalName,
  })
}
