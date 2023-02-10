const { extractValidFields, validateAgainstSchema } = require('../../lib/validator')

const courseInformationSchema = {
    name: {required: true},
    description: {required: false},
    published: {required: false}
}

exports.extractCourseFields = (body) => {
    return extractValidFields(body, courseInformationSchema)
}

exports.validateCourseCreationRequest = (body) => {
    return validateAgainstSchema(body, courseInformationSchema)
}