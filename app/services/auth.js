const jwt = require('jsonwebtoken')

const { User } = require('../models/user')

function generateAuthToken(user) {
    const payload = { sub: user.id }
    return jwt.sign(payload, secret, { expiresIn: '24h' })
}
exports.generateAuthToken = generateAuthToken

function requireAuthentication(req, res, next) {
    const token = extractToken(req)
    try {
        const payload = jwt.verify(token, secret)
        req.user = payload.sub
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