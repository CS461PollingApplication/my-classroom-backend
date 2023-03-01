const { Router } = require('express')
const router = Router()

const db = require('../models/index')
const { logger } = require('../../lib/logger')
const sectionService = require('../services/section_service')
const { requireAuthentication, generateOTP } = require('../../lib/auth')
const { ValidationError, UniqueConstraintError } = require('sequelize')

async function checkIfTeacher(userId, courseId) {
    return await db.Enrollment.findOne({
        where: { 
            userId: userId,
            courseId: courseId,
            role: 'teacher'
        }
    })
}

async function getSection(sectionId) {
    return await db.Section.findOne({
        where: { 
            id: sectionId
        }
    })
}

async function getLecturesFromSection(sectionId) {
    return await db.Lecture.findAll({
        include: [{
            model: db.LectureForSection,
            include: [{
                model: db.Section,
                where: { id: sectionId },
            }],
            attributes: []  // don't return any attributes from join (only lecture fields)
        }],
        attributes: { exclude: ['CourseId'] }   // exclude duplicate CourseId field from join
    })
}

router.post('/:course_id/sections', requireAuthentication, async function (req, res, next) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub
    const courseId = parseInt(req.params['course_id'])

    // make sure the user creating this section is the teacher for the course
    const isTeacher = await checkIfTeacher(user.id, courseId)

    if (req.body.number && isTeacher) {
        const sectionToInsert = {
            courseId: parseInt(req.params['course_id']),
            number: req.body.number
        }
        try {
            const section = await db.Section.create(sectionToInsert)
            res.status(201).send({
                section: sectionService.extractSectionFields(section)
            })
        } catch (e) {
            if (e instanceof UniqueConstraintError) {
                res.status(400).send({
                    error: "A section for this course with this section number already exists"
                })
            }
            else if (e instanceof ValidationError) {
                // this will happen if a randomly generated join code is not unique
                next(e)
            }
            else {
                logger.error(e)
                res.status(500).send({error: "An unexpected error occured. Please try again"})
            }
        }
    } else {
        if (isTeacher) {
            res.status(400).send({error: `Request did not contain required fields to create a section`})
        }
        else if (req.body.number) {
            res.status(403).send({error: `Only the teacher for a course can create a section`})
        }
        else {
            res.status(403).send({error: `Request did not contain required fields to create a section and user does not have credentials to do so anyways`})
        }
    }
})

router.get('/:course_id/sections/:section_id', requireAuthentication, async function (req, res, next) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub
    const courseId = parseInt(req.params['course_id'])
    const sectionId = parseInt(req.params['section_id'])

    const isTeacher = await checkIfTeacher(user.id, courseId)
    const respObj = {}  // will hold the full endpoint response at the end

    if (isTeacher) {
        try {
            const foundSection = await getSection(sectionId)  // *** returning back all fields... do we want to only return a few? ***
            if (foundSection != null) {
                respObj['section'] = foundSection
                let relatedLectures = await getLecturesFromSection(sectionId)
                respObj['lectures'] = relatedLectures
                res.status(200).send(respObj)
            }
            else {
                res.status(404).send({error: "There is no section for the provided section id"})
            }
        }
        catch (e) {
            if (e instanceof ValidationError) {
                return res.status(400).send({error: serializeSequelizeErrors(e)})
            }
            else {
                next(e)
            }
        }
    }
    else {
        res.status(403).send({error: "Must be a teacher of this course to get section info"})
    }
})

module.exports = router