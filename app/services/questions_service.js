const { extractValidFields, validateAgainstSchema } = require('../../lib/validator')

const questionInformationSchema = {
    id: {required: true},
    courseId: {required: true},
    type: {required: true},
    stem: {required: true},
    content: {required: false},
    answers: {required: false}
}
