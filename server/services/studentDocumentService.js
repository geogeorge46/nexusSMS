import mongoose from 'mongoose'

import { Student } from '../models/Student.js'
import { documentCategories, StudentDocument } from '../models/StudentDocument.js'
import { scanDocumentBuffer } from './documentScanService.js'
import { buildDownloadUrl, deleteDocumentFromCloudinary, uploadDocumentToCloudinary } from './documentStorageService.js'

export async function listDocuments(filters = {}) {
  const query = {}

  if (filters.category && filters.category !== 'All') query.documentType = filters.category
  if (filters.studentId) query.studentId = await resolveStudentId(filters.studentId)
  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search), 'i')
    query.$or = [{ title: search }, { fileName: search }, { studentName: search }, { registerNumber: search }]
  }

  const records = await StudentDocument.find(query).sort({ uploadedAt: -1 }).lean()
  const documents = records.map(serializeDocument)

  return {
    documents,
    grouped: documentCategories.map((category) => ({
      category,
      count: documents.filter((document) => document.documentType === category).length,
    })),
    total: documents.length,
  }
}

export async function createDocuments(files, payload) {
  if (!files?.length) throw httpError(400, 'At least one document is required')

  const student = await Student.findById(await resolveStudentId(payload.studentId))
    .select('name registerNumber')
    .lean()
  const createdDocuments = []

  for (const file of files) {
    const scan = await scanDocumentBuffer(file)
    if (scan.status !== 'passed') throw httpError(422, scan.message)

    const storagePayload = {
      category: payload.category,
      studentName: student.name,
      registerNumber: student.registerNumber,
    }
    const uploaded = await uploadDocumentToCloudinary(file, storagePayload)
    const downloadUrl = buildDownloadUrl(uploaded.publicId, uploaded.resourceType, file.originalname)

    try {
      const document = await StudentDocument.create({
        studentId: student._id,
        studentName: student.name,
        registerNumber: student.registerNumber,
        documentType: normalizeCategory(payload.category),
        title: payload.title?.trim() || file.originalname,
        fileName: file.originalname,
        fileUrl: uploaded.secureUrl,
        cloudinaryPublicId: uploaded.publicId,
        cloudinaryAssetId: uploaded.assetId,
        resourceType: uploaded.resourceType,
        downloadUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum: scan.checksum,
        scanStatus: scan.status,
        uploadedBy: payload.user?.name ?? 'Nexus Admin',
        uploadedAt: new Date(),
      })
      createdDocuments.push(serializeDocument(document.toObject()))
    } catch (error) {
      await deleteDocumentFromCloudinary(uploaded.publicId, uploaded.resourceType)
      throw error
    }
  }

  return createdDocuments
}

export async function deleteDocument(documentId) {
  const document = await StudentDocument.findById(documentId)
  if (!document) throw httpError(404, 'Document not found')

  await deleteDocumentFromCloudinary(document.cloudinaryPublicId, document.resourceType)
  await document.deleteOne()
  return { id: documentId }
}

export async function getDocumentDownload(documentId) {
  const document = await StudentDocument.findById(documentId).lean()
  if (!document) throw httpError(404, 'Document not found')
  return { downloadUrl: document.downloadUrl, originalName: document.fileName }
}

async function resolveStudentId(value) {
  if (!value) throw httpError(400, 'Student is required')
  if (mongoose.Types.ObjectId.isValid(value)) {
    if (await Student.exists({ _id: value })) return value
  } else {
    const student = await Student.findOne({ registerNumber: value }).select('_id').lean()
    if (student) return student._id
  }
  throw httpError(404, 'Student not found')
}

function serializeDocument(document) {
  return {
    _id: document._id.toString(),
    studentId: document.studentId?.toString() ?? '',
    documentType: document.documentType,
    category: document.documentType,
    title: document.title,
    fileName: document.fileName,
    originalName: document.fileName,
    fileUrl: document.fileUrl,
    secureUrl: document.fileUrl,
    cloudinaryPublicId: document.cloudinaryPublicId,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    size: document.fileSize,
    uploadedBy: document.uploadedBy,
    uploadedAt: document.uploadedAt,
    createdAt: document.uploadedAt,
    studentName: document.studentName,
    registerNumber: document.registerNumber,
    downloadUrl: document.downloadUrl,
    scanStatus: document.scanStatus,
  }
}

function normalizeCategory(category) {
  return documentCategories.includes(category) ? category : 'Other'
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
