const { extractValidFields, validateAgainstSchema } = require('../../lib/validator')

const sectionInformationSchema = {
    courseId: {required: true},
    number: {required: true},
    joinCode: {required: true}
}

exports.extractSectionFields = (body) => {
    return extractValidFields(body, sectionInformationSchema)
}

exports.validateSectionCreationRequest = (body) => {
    return validateAgainstSchema(body, sectionInformationSchema)
}