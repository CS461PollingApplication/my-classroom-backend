const { Router } = require('express')
const router = Router()
const db = require('../models/index')
const { logger } = require('../services/logger')

// determine if a user is in a course, via enrollments table
// true = yes, false = no
async function isUserInCourse(userId, courseId) {
    const enrollment = await db.Enrollment.findOne({
        where: { 
            userId: userId,
            courseId: courseId
        }
    })
    return enrollment != null   // return true if a value was found, false otherwise
}

//GET request from /courses homepage
router.get('/', async function (req, res) {
    // TODO: use the authentication token (bearer) to authenticate & find the user
    const user = await db.User.findOne({ // replace this with a find to get the user by id (available after authentication)
        where: { email: 'memer@myclassroom.com' }
    })

    const teacherCourses = await db.Course.findAll({
        include: [{
            model: db.Enrollment,
            where: { role: 'teacher', userId: user.id }
        }]
    })
    const studentCourses = await db.Course.findAll({
        include: [
            {
                model: db.Section,
                include: [
                    {
                        model: db.Enrollment,
                        where: { role: 'student', userId: user.id },
                    }
                ]
            }
        ]
    })
    // if (teacherCourses == [] && studentCourses == []) {
    //     res.status(204).send()
    // }
    res.status(200).json({
        "studentCourses": studentCourses,
        "teacherCourses": teacherCourses
    })
})

router.use('/:course_id/lectures', async function (req, res) {
    // TODO: authenticate user
    if (!isUserInCourse(user.id, req.params.course_id)) {  // if this user isn't in this course
        res.status(403).send()
    }
    else {
        // because of the checks above, all request handlers in lectures.js assume user validity and
        // that user is in this course
        require('./lectures.js')
    }
})

module.exports = router