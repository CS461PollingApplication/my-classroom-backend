const router = require('express').Router({ mergeParams: true })
const db = require('../models/index')
const { requireAuthentication } = require('../../lib/auth')

// base path: /courses/:course_id/lectures

async function getEnrollmentFromCourse(userId, courseId) {
    return await db.Enrollment.findOne({
        where: {
            userId: userId,
            courseId: courseId
        }
    })
}

async function getEnrollmentFromSectionInCourse(userId, courseId) {
    return await db.Enrollment.findOne({
        where: {
            userId: userId,
            sectionId: await getSectionsIdsFromCourse(courseId)
        }
    })
}

async function getCourse(courseId) {
    return await db.Course.findOne({
        where: { id: courseId }
    })
}

async function getLecture(lectureId) {
    return await db.Lecture.findOne({
        where: { id: lectureId }
    })
}

async function getSectionsIdsFromCourse(courseId) {
    const found_sections = await db.Section.findAll({
        where: { courseId: courseId },
        attributes: ['id']
    })
    // extract ids of returned sections
    let section_ids = []
    for (let i = 0; i < found_sections.length; i++) {
        section_ids.push(found_sections[i].id)     
    }
    return section_ids
}

async function getSectionLectureRelation (lectureId, sectiondId) {
    return await db.LectureForSection.findOne({
        where: {
            lectureId: lectureId,
            sectionId: sectiondId
        }
    }
)}

// get all lecture objects for the current course
router.get('/', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const courseId = req.params.course_id
    const enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)
    const course = await getCourse(courseId)

    if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
    }
    else if (enrollment.role == 'student' && !course.published) {   // if user is a student, and course isn't published, return 'No Content'
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
                "lecture": lectures
            })
        }
    }
})

router.post('/', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const courseId = req.params.course_id
    const enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)
    if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
    }
    var lecture     // will hold the returned lecture object from database

    // TODO: how are we treating the role 'ta'?
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
        const sectionIds = await getSectionsIdsFromCourse(courseId);
        if (sectionIds.length == 0) {
            res.status(400).send({error: "There are no sections in this course, cannot create lecture"})
            // TODO: delete the lecture created above?
        }
        try {
            // iterate through each section in this course and add relationship
            for (let i = 0; i < sectionIds.length; i++) {
                await db.LectureForSection.create({
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

router.put('/:lecture_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const lectureId = req.params.lecture_id
    const enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)
    if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
    }
    var lecture     // will hold the updated lecture object from database

    if (enrollment.role == 'teacher') {
        updatedLec = req.body
        try {
            ret_obj = await db.Lecture.update(
                updatedLec,     // provided body from request
                { where: { id: lectureId }, returning: true }
            )
            lecture = ret_obj[1]    // index-1 of return holds the updated lecture
        }
        catch (e) {
            // TODO: send back better error msg using exception 'e' (/lib/string_helpers.js - serializeSequelizeErrors())
            res.status(400).send({error: "Unable to update lecture object"})
        }
        res.status(200).json(lecture)   // all good, return updated lecture object
    }
    else {      // if user is not a teacher
        res.status(403).send()
    }
})

router.get('/:lecture_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const lectureId = req.params.lecture_id
    const enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)
    if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
    }
    var full_response = {}  // will hold response with lecture info and related questions

    if (enrollment.role == 'teacher') {     // if teacher, send lecture info & all related questions
        try {
            const lecture = await getLecture(lectureId)
            full_response.push(lecture)

            const questions_in_lec = await db.sequelize.query(  // raw sql query to get all questions in this lecture using `QuestionInLecture`
                'SELECT q.* FROM Question q INNER JOIN QuestionInLecture ql ON q.id = ql.questionId INNER JOIN Lecture l ON ql.lectureId = l.id'
            )
            full_response.push(questions_in_lec)
        }
        catch (e) {
            // TODO: send back better error msg using exception 'e' (/lib/string_helpers.js - serializeSequelizeErrors())
            res.status(400).send({error: "Unable to get lecture or questions"})
        }
        res.status(200).send(full_response)
    }
    else {  // if student, only send published info
        sectionLectureRelation = await getSectionLectureRelation(lectureId, enrollment.sectionId)
        if (!sectionLectureRelation.published) {    // if this lecture (from user's section) isn't published
            res.send(404).send()
        }
        else {  // if this lecture (from user's section) is published
            try {
                const lecture = await getLecture(lectureId)
                full_response.push(lecture)
    
                const questions_in_lec = await db.sequelize.query(  // raw sql query to get all published questions in this lecture using `QuestionInLecture`
                    'SELECT q.* FROM Question q INNER JOIN QuestionInLecture ql ON q.id = ql.questionId INNER JOIN Lecture l ON ql.lectureId = l.id WHERE ql.published = 1'
                )
                full_response.push(questions_in_lec)
            }
            catch (e) {
                // TODO: send back better error msg using exception 'e' (/lib/string_helpers.js - serializeSequelizeErrors())
                res.status(400).send({error: "Unable to get lecture or questions"})
            }
            // TODO: add check if lecture has ever been published in the past? is there a database field to check that?
            // TODO: add check if the full_response is empty
            res.status(200).json(full_response)   // all good, return updated lecture object
        }
    }
})

// delete lecture and ALL relations to this lecture
router.delete('/:lecture_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const lectureId = req.params.lecture_id
    let enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)

    if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
    }

    if (enrollment.role != 'teacher') {
        res.status(403).send()
    }
    else {  // if user is a teacher
        try {
            await db.Lecture.destroy({  // delete from lecture table
                where: {
                    id: lectureId
                }
            })
            await db.QuestionInLecture.destroy({    // delete from lecture-question relationship
                where: {
                    lectureId: lectureId
                }
            })
            await db.LectureForSection.destroy({    // delete from lecture-section relationship
                where: {
                    lectureId: lectureId
                }
            })
        }
        catch (e) {
            res.status(500).send()
        }
    }
})

module.exports = router
