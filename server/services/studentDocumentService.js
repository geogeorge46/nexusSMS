import { documentCategories, StudentDocument } from '../models/StudentDocument.js'
import { scanDocumentBuffer } from './documentScanService.js'
import {
  buildDownloadUrl,
  deleteDocumentFromCloudinary,
  uploadDocumentToCloudinary,
} from './documentStorageService.js'

export async function listDocuments(filters = {}) {
  const query = {}

  if (filters.category && filters.category !== 'All') {
    query.category = filters.category
  }

  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search), 'i')
    query.$or = [
      { title: search },
      { originalName: search },
      { studentName: search },
      { registerNumber: search },
    ]
  }

  const documents = await StudentDocument.find(query).sort({ createdAt: -1 }).lean()
  const grouped = documentCategories.map((category) => ({
    category,
    count: documents.filter((document) => document.category === category).length,
  }))

  return {
    documents,
    grouped,
    total: documents.length,
  }
}

export async function createDocuments(files, payload) {
  if (!files?.length) {
    const error = new Error('At least one document is required')
    error.statusCode = 400
    throw error
  }

  const createdDocuments = []

  for (const file of files) {
    const scan = await scanDocumentBuffer(file)

    if (scan.status !== 'passed') {
      const error = new Error(scan.message)
      error.statusCode = 422
      throw error
    }

    const uploaded = await uploadDocumentToCloudinary(file, payload)
    const downloadUrl = buildDownloadUrl(uploaded.publicId, uploaded.resourceType, file.originalname)

    const document = await StudentDocument.create({
      student: payload.studentId || undefined,
      studentName: payload.studentName,
      registerNumber: payload.registerNumber,
      category: normalizeCategory(payload.category),
      title: payload.title || file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      cloudinaryPublicId: uploaded.publicId,
      cloudinaryAssetId: uploaded.assetId,
      resourceType: uploaded.resourceType,
      secureUrl: uploaded.secureUrl,
      downloadUrl,
      checksum: scan.checksum,
      scanStatus: scan.status,
      uploadedBy: payload.uploadedBy || 'Nexus Admin',
    })

    createdDocuments.push(document.toObject())
  }

  return createdDocuments
}

export async function deleteDocument(documentId) {
  const document = await StudentDocument.findById(documentId)

  if (!document) {
    const error = new Error('Document not found')
    error.statusCode = 404
    throw error
  }

  await deleteDocumentFromCloudinary(document.cloudinaryPublicId, document.resourceType)
  await document.deleteOne()

  return { id: documentId }
}

export async function getDocumentDownload(documentId) {
  const document = await StudentDocument.findById(documentId).lean()

  if (!document) {
    const error = new Error('Document not found')
    error.statusCode = 404
    throw error
  }

  return {
    downloadUrl: document.downloadUrl,
    originalName: document.originalName,
  }
}

function normalizeCategory(category) {
  if (documentCategories.includes(category)) {
    return category
  }

  return 'Other'
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
