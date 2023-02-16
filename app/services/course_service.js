const { extractValidFields, validateAgainstSchema } = require('../../lib/validator')

const courseInformationSchema = {
    id: {required: true},
    name: {required: true},
    description: {required: false},
    published: {required: false}
}

const courseInsertSchema = {
    name: {required: true},
    description: {required: false},
    published: {required: false}
}

exports.extractCourseFields = (body) => {
    return extractValidFields(body, courseInformationSchema)
}

exports.validateCourseCreationRequest = (body) => {
    return validateAgainstSchema(body, courseInsertSchema)
}

exports.extractArrayCourseFields = (courses) => {
    return courses.map(course => extractValidFields(course, courseInformationSchema))
}