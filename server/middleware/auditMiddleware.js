import { createAuditLog } from '../services/auditLogService.js'

export function auditAction({ action, module, description }) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return

      void createAuditLog({
        user: req.user?.name ?? 'Unknown User',
        role: req.user?.role ?? 'Admin',
        action,
        module,
        description:
          typeof description === 'function'
            ? description(req, res)
            : description,
        ipAddress: getIpAddress(req),
        browser: getBrowser(req.header('user-agent') ?? ''),
        device: getDevice(req.header('user-agent') ?? ''),
        metadata: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        },
      }).catch((error) => {
        console.error('Audit log write failed:', error.message)
      })
    })

    next()
  }
}

export function getAuditContext(req) {
  return {
    user: req.user?.name ?? 'Unknown User',
    role: req.user?.role ?? 'Admin',
    ipAddress: getIpAddress(req),
    browser: getBrowser(req.header('user-agent') ?? ''),
    device: getDevice(req.header('user-agent') ?? ''),
  }
}

function getIpAddress(req) {
  return (
    req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    ''
  )
}

function getBrowser(userAgent) {
  if (/edg/i.test(userAgent)) return 'Edge'
  if (/chrome|crios/i.test(userAgent)) return 'Chrome'
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari'
  return 'Unknown'
}

function getDevice(userAgent) {
  if (/mobile|iphone|android/i.test(userAgent)) return 'Mobile'
  if (/ipad|tablet/i.test(userAgent)) return 'Tablet'
  return 'Desktop'
}
