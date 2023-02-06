const { Router } = require('express')
const router = Router()
const db = require('../models/index')
const { requireAuthentication } = require('../../lib/auth')

async function getEnrollment(userId, courseId) {
    return await db.Enrollment.findOne({
        where: { 
            userId: userId,
            courseId: courseId
        }
    })
}

async function getCourse(courseId) {
    return await db.Course.findOne({
        where: {
            courseId: courseId
        }
    })
}

// get all lecture objects for the current course
router.get('/', async function (req, res) {
    const user = req.user
    const courseId = req.params.course_id
    const enrollment = getEnrollment(user.id, courseId)

    if (enrollment.role == 'student' && !getCourse(courseId).published) {   // if student and course isn't published, return 'No Content' code
        res.status(204).send()
    }
    else {  // if teacher, OR student in published course
        const lectures = await db.Lecture.findAll({
            where: { courseId: courseId }
        })
        if (lectures == []) {   // if no lectures are in this course
            res.status(204).send()
        }
        else {
            res.status(200).json({
                "lectures": lectures
            })
        }
    }
})

module.exports = router
