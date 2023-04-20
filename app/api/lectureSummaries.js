const router = require('express').Router({ mergeParams: true })
const db = require('../models/index')
const { requireAuthentication } = require('../../lib/auth')
const { serializeSequelizeErrors } = require('../../lib/string_helpers')
const { UniqueConstraintError, ValidationError } = require('sequelize')
const questionService = require('../services/question_service')
const responseService = require('../services/response_service')

// teacher or student is looking at the responses to questions given in a lecture
router.get('/', requireAuthentication, async function (req, res, next) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub
    const courseId = parseInt(req.params['course_id'])
    const sectionId = parseInt(req.params['section_id'])
    const lectureId = parseInt(req.params['lecture_id'])

    // check if user is a teacher for the course
    const enrollmentTeacher = await db.Enrollment.findOne({
        where: { 
            userId: user.id,
            courseId: courseId,
            role: 'teacher'
        }
    })

    // check if user is a student in the section
    const enrollmentStudent = await db.Enrollment.findOne({
        where: { 
            role: 'student', 
            userId: user.id,
            section_id: sectionId
        }
    })

    if (enrollmentTeacher) {
        try {
            // this will be the object in the API response
            // format:
            /* {
                [
                    {
                        average score,
                        number of responses,
                        ...question entity fields (id, stem, etc),
                        responses: [{
                            student name,
                            response: {
                                ...response fields (answer, score, etc)
                            }
                        }]
                    }
            ]}*/
            let resp = []
            // get all the questionInLectures for the given lecture
            const questionsInLecture = await db.QuestionInLecture.findAll({
                where: {
                    lectureId: lectureId
                }
            })
            // for each questionInLecture, get the question asked as well as an array of responses to it
            // complexity: roughly O(m * n) where m is the number of questions and n is the number of responses per question
            // this complexity calculation assumes database queries are roughly O(1), which may not be the case depending on database size
            for (var i = 0; i < questionsInLecture.length; i++) {
                const question = await db.Question.findByPk(questionsInLecture[i].questionId)
                const responses = await db.Response.findAll({
                    where: {
                        questionInLectureId: questionsInLecture[i].id
                    }
                })
                let questionArrayObj = {
                    averageScore: 0,
                    numberOfResponses: responses.length,
                    ...question,
                    responses: []
                }
                for (var j = 0; j < responses.length; j++) {
                    const student = await db.User.findOne({
                        include: [
                            {
                                model: db.Enrollment,
                                required: true,
                                include: [
                                    {
                                        model: db.Response,
                                        required: true,
                                        where: { id: responses[j].id }
                                    }
                                ]
                            }
                        ]
                    })
                    questionArrayObj.responses.push({
                        studentName: `${student.firstName} ${student.lastName}`,
                        response: { ...responses[j] }
                    })
                }
                resp.push(questionArrayObj)
            }

            res.status(200).send(resp)

        } catch (e) {
            next(e)
        }
    }
    else if (enrollmentStudent) {
        // TODO
    }
    else {
        res.status(403).send({ error: "User is neither the teacher for the course nor a student in the correct section of the course" })
    }
})

module.exports = router