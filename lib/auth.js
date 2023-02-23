const jwt_utils = require('./jwt_utils')
const db = require('../app/models')

function generateUserAuthToken(user) {
    const payload = {
        sub: user.id,
        admin: user.admin
    }
    // TODO: create a session for the user or update the expiration
    return jwt_utils.encode(payload)
}
exports.generateUserAuthToken = generateUserAuthToken

function requireAuthentication(req, res, next) {
    const token = extractToken(req)
    try {
        const payload = jwt_utils.decode(token)
        req.payload = payload
        // TODO: update the expiration on the session for the user
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

// generates a one time password of length and containing digits 0-9 & all lowercase letters in the English alphabet
exports.generateOTP = (length) => {
    const digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    var otp = ''
    for(let i = 1; i <= length; i++) {
        var index = Math.floor(Math.random()*(digits.length))
        otp = otp + digits[index]
    }
    return otp;
}