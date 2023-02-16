const { Router } = require('express')
const router = Router()

const course = require('../models/course')
const db = require('../models/index')
const { logger } = require('../../lib/logger')
const courseService = require('../services/course_service')
const enrollmentService = require('../services/enrollment_service')
const sectionService = require('../services/section_service')
const { generateUserAuthToken, requireAuthentication } = require('../../lib/auth')
const e = require('express')

router.post('/:course_id/sections', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub) // find user by ID, which is stored in sub

    if (req.body.courseId && req.body.number && req.body.joinCode) {
        const sectionToInsert = {
            courseId: parseInt(req.params['course_id']),
            number: req.body.number,
            joinCode: req.body.joinCode
        }
        const missingFields = sectionService.validateSectionCreationRequest(sectionToInsert)
        if (missingFields.length == 0) {
            const section = await db.Section.create(sectionToInsert)
            res.status(201).send({
                section: sectionService.extractSectionFields(section)
            })
        } else {
            res.status(400).send({error: `Section did not have all the required fields, it was missing ${missingFields}`})
        }
    } else {
        res.status(400).send({error: `Request did not contain required fields to create a section`})
    }
})

module.exports = router