import crypto from 'node:crypto'

const blockedBinarySignatures = [
  Buffer.from('4d5a', 'hex'), // Windows executable
  Buffer.from('7f454c46', 'hex'), // ELF executable
]

export async function scanDocumentBuffer(file) {
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex')
  const firstBytes = file.buffer.subarray(0, 4)
  const matchedExecutable = blockedBinarySignatures.some((signature) =>
    firstBytes.subarray(0, signature.length).equals(signature),
  )

  if (matchedExecutable) {
    return {
      checksum,
      status: 'failed',
      message: 'Executable binary signatures are blocked',
    }
  }

  return {
    checksum,
    status: 'passed',
    message: 'Pre-storage validation passed',
  }
}
