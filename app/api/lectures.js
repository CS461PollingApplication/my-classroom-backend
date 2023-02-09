const { Router } = require('express')
const router = Router()
const db = require('../models/index')
const section = require('../models/section')

// base path: /courses/:course_id/lectures

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

async function getSectionsIdsFromCourse(courseId) {
    return await db.Section.findAll({
        where: {
            courseId: courseId
        },
        attributes: ['id']
    })
}

// get all lecture objects for the current course
router.get('/', async function (req, res) {
    const user = req.user
    const courseId = req.params.course_id
    const enrollment = getEnrollment(user.id, courseId)

    if (enrollment.role == 'student' && !getCourse(courseId).published) {   // if user is a student, and course isn't published, return 'No Content'
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

router.post('/', async function (req, res) {
    const user = req.user
    const courseId = req.params.course_id
    const enrollment = getEnrollment(user.id, courseId)
    var lecture     // will hold the returned lecture object from database

    if (enrollment.role == 'teacher') {
        // create lecture object
        newLec = req.body
        newLec.push({courseId: courseId})
        try {   
            lecture = await db.Lecture.create(newLec)
        }
        catch (e) {
            // TODO: send back better error msg using exception 'e' (/lib/string_helpers.js - serializeSequelizeErrors())
            res.status(400).send({error: "Unable to create lecture object"})
        }

        // create lecture-section association for all sections in course
        const sectionIds = getSectionsIdsFromCourse(courseId);
        if (sectionIds.length == 0) {
            res.status(400).send({error: "There are no sections in this course, cannot create lecture"})
            // TODO: delete the lecture created above?
        }
        try {
            // iterate through each section in this course and add relationship
            for (let i = 0; i < section.length; i++) {
                db.LectureForSection.create({
                    lectureId: lecture.id,
                    sectionId: sectionIds[i].id
                    // TODO: currently no other fields are being added here
                    // ...should it be added here, or in /:section_id/lectures ?
                })
            }
        }
        catch (e) {
            // TODO: send back better error msg using exception 'e' (/lib/string_helpers.js - serializeSequelizeErrors())
            res.status(400).send({error: "Unable to create association between lecture & this course' sections"})
        }
        res.status(200).json(lecture)   // all good, return lecture object
    }
    else {      // if user is not a teacher
        res.status(403).send()
    }
})

module.exports = router
