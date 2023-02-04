const db = require('../models')
const { extractValidFields, validateAgainstSchema } = require('../../lib/validator')
const { logger } = require('../../lib/logger')

const userInformationSchema = {
    firstName: { required: true },
    lastName: { required: true },
    email: { required: true },
}

const userCreationSchema = {
    ...userInformationSchema,
    rawPassword: { required: true },
}

const userCreationRequestSchema = {
    ...userCreationSchema,
    confirmedPassword: { required: true }
}

module.exports = {
    validateUserCreationRequest: (body) => {
        return validateAgainstSchema(body, userCreationRequestSchema)
    },
    extractUserCreationFields: (body) => {
        return extractValidFields(body, userCreationSchema)
    },
    filterUserFields: (body) => {
        return extractValidFields(body, userInformationSchema)
    }
}