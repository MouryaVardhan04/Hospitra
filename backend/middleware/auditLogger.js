import auditLogModel from "../models/auditLogModel.js";

const safeKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return []
    return Object.keys(obj).slice(0, 50)
}

const auditLogger = (req, res, next) => {
    const start = Date.now()
    res.on('finish', async () => {
        try {
            if (!req.path.startsWith('/api')) return
            if (req.path.startsWith('/api/debug')) return

            const actor = req.auditActor || {}
            const actorType = actor.type || (req.body?.userId ? 'user' : req.body?.docId ? 'doctor' : '')
            const actorId = actor.id || req.body?.userId || req.body?.docId || ''
            const actorName = actor.name || ''

            const log = new auditLogModel({
                actorType,
                actorId,
                actorName,
                action: `${req.method} ${req.path}`,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || '',
                userAgent: req.headers['user-agent'] || '',
                params: req.params || {},
                query: req.query || {},
                bodyKeys: safeKeys(req.body),
                createdAt: Date.now()
            })

            await log.save()
        } catch (e) {
            // avoid blocking response
            console.warn('[audit] log failed:', e?.message || e)
        }
    })

    next()
}

export default auditLogger
