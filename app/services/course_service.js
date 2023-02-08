//const { extractValidFields, validateAgainstSchema } = require('../../lib/validator')

const courseInformationSchema = {
    name: {required: true},
    description: {required: false},
    published: {required: true}
}

exports.extractCourseFields = (body) => {
    //uncomment after lib/validator.js is pushed to main
    //return extractValidFields(body, courseInformationSchema)
}