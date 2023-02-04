const jwt_utils = require('./jwt_utils')
const db = require('../app/models')

function generateUserAuthToken(user) {
    const payload = {
        sub: user.id,
        admin: user.admin
    }
    return jwt_utils.encode(payload)
}
exports.generateUserAuthToken = generateUserAuthToken

function requireAuthentication(req, res, next) {
    const token = extractToken(req)
    try {
        const payload = jwt_utils.decode(token)
        req.payload = payload
        next()
    } catch (err) {
        res.status(401).send({
            err: "Invalid authentication token"
        })
    }
}
exports.requireAuthentication = requireAuthentication

function extractToken(req) {
    const authHeader = req.get('authorization') || ''
    const authParts = authHeader.split(' ')
    const token = authParts[0] === 'Bearer' ? authParts[1] : null
    return token
}
exports.extractToken = extractToken