import { spawn } from 'node:child_process'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'

const mongoUri = process.env.MONGODB_URI
const backupDir = path.resolve(process.env.BACKUP_DIR ?? './backups')
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 14)

if (!mongoUri) {
  console.error('MONGODB_URI is required for backups')
  process.exit(1)
}

await mkdir(backupDir, { recursive: true })

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const archivePath = path.join(backupDir, `nexus-${timestamp}.archive.gz`)

await run('mongodump', [`--uri=${mongoUri}`, `--archive=${archivePath}`, '--gzip'])
await pruneBackups()

console.log(`MongoDB backup created: ${archivePath}`)

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} exited with code ${code}`))
    })
  })
}

async function pruneBackups() {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  const entries = await readdir(backupDir)

  await Promise.all(
    entries
      .filter((entry) => entry.startsWith('nexus-') && entry.endsWith('.archive.gz'))
      .map(async (entry) => {
        const filePath = path.join(backupDir, entry)
        const details = await stat(filePath)

        if (details.mtimeMs < cutoff) {
          await rm(filePath)
        }
      }),
  )
}
