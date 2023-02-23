const { Router } = require('express')
const router = Router()
const db = require('../models/index')
const courseService = require('../services/course_service')
const enrollmentService = require('../services/enrollment_service')
const sectionService = require('../services/section_service')
const { requireAuthentication } = require('../../lib/auth')

router.put('/:course_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub
    const courseId = parseInt(req.params['course_id'])

    // we want to update a course only if the user for the course is a teacher
    const enrollment = await db.Enrollment.findOne({
        where: { 
            userId: user.id,
            courseId: courseId,
            role: 'teacher'
        }
    })

    if (enrollment) {
        // all fields are required in the request, even if unchanged
        if (req.body.name && req.body.description && req.body.published) {
            const course = await db.Course.findByPk(courseId)
            try {
                await course.update({
                    name: req.body.name,
                    description: req.body.description,
                    published: req.body.published
                })
                res.status(200).send({
                    course: courseService.extractCourseFields(course)
                })
            } catch {
                logger.error(e)
                res.status(500).send({error: "An unexpected error occured. Please try again"})
            }
        } else {
            res.status(400).send({error: "Request must contain name, description, and published status"})
        }
    } else {
        res.status(403).send({error: `Only the teacher for a course can edit the course`})
    }
})

router.delete('/:course_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub
    const courseId = parseInt(req.params['course_id'])

    // we want to update a course only if the user for the course is a teacher
    // **NOTE: might be valuable at some point to just create a function that checks if a user is a teacher?
    const enrollment = await db.Enrollment.findOne({
        where: { 
            userId: user.id,
            courseId: courseId,
            role: 'teacher'
        }
    })

    if (enrollment) {
        const course = await db.Course.findByPk(courseId)
        try {
            await course.destroy()
            res.status(200).send()
        } catch {
            logger.error(e)
            res.status(500).send({error: "An unexpected error occured. Please try again"})
        }
    } else {
        res.status(403).send({error: `Only the teacher for a course can delete the course`})
    }
})

module.exports = router