const { Router } = require('express')
const router = Router()
const db = require('../models/index')
const courseService = require('../services/course_service')
const enrollmentService = require('../services/enrollment_service')
const sectionService = require('../services/section_service')
const { requireAuthentication } = require('../../lib/auth')

router.use('/', require('./sections'))

//GET request from /courses homepage
router.get('/', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub
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

    res.status(200).send({
        studentCourses : courseService.extractArrayCourseFields(studentCourses),
        teacherCourses : courseService.extractArrayCourseFields(teacherCourses)
    })

})

//User Creates a course
//Authenticate token, create course & create enrollment for logged in user as teacher in the course
router.post('/', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub

    // create course & role as a teacher in enrollment
    // create course 
    if (req.body.name) { // name is required, other fields can be left unspecified
        // create course with valid fields
        const course = await db.Course.create(courseService.extractCourseFields(req.body))
        
        //create the enrollment
        const enrollmentToInsert = {
            courseId: course.id,
            userId: user.id,
            role: 'teacher'
            // no section because they are a teacher
        }
        const enrollment = await db.Enrollment.create(enrollmentToInsert)
        res.status(201).send({
            course: courseService.extractCourseFields(course),
            enrollment: enrollmentService.extractEnrollmentFields(enrollment)
        })
    } else {
        res.status(400).send({error: "A course requires a name"})
    }

})

//User joins with course code
//Authenticate token & create enrollment for the user in the section that has a code 
router.post('/join', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub

    const joinCode = req.body.joinCode
    if (joinCode) {

        const section = await db.Section.findOne({
            where: { joinCode: joinCode }
        })

        if (section) {
            // create the enrollment
            const enrollmentToInsert = {
                sectionId: section.id,
                userId: user.id,
                role: 'student'
                // no course because they are a student
            }
            const enrollment = await db.Enrollment.create(enrollmentToInsert)
            res.status(201).send({
                section: sectionService.extractSectionFields(section),
                enrollment: enrollmentService.extractEnrollmentFields(enrollment)
            })
        } else {
            res.status(404).send({error: `No section exists with the provided join code`})
        }
    } else {
        res.status(400).send({error: `Request did not contain a join code`})
    }
})


module.exports = router