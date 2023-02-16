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
    })
}

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
    var lecture     // will hold the returned lecture object from database

    if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
    }
    else if (enrollment.role == 'teacher') {
        // create lecture object
        let newLec = req.body
        newLec['courseId'] = courseId
        try {
            lecture = await db.Lecture.create(newLec)
        }
        catch (e) {
            res.status(400).send({error: "Unable to create lecture object"})
            return
        }

        // create lecture-section association for all sections in course
        const sectionIds = await getSectionsIdsFromCourse(courseId);
        try {
            // iterate through each section in this course and add relationship
            for (let i = 0; i < sectionIds.length; i++) {
                await db.LectureForSection.create({
                    lectureId: lecture.id,
                    sectionId: sectionIds[i]
                    // TODO: no other fields are being added here
                    // ...should it be added here, or in /:section_id/lectures ?
                })
            }
        }
        catch (e) {
            res.status(400).send({error: "Unable to create association between lecture & this course' sections"})
            return
        }
        res.status(201).json(lecture)   // all good, return lecture object
    }
    else {      // if user is not a teacher
        res.status(403).send()
    }
})

router.put('/:lecture_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const lectureId = req.params.lecture_id
    const courseId = req.params.course_id
    const enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)
    const lecture = await getLecture(lectureId)
    
    if (lecture == null) {
        res.status(404).send({error: "Lecture of this id does not exist"})
        return
    }
    else if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
    }
    else if (enrollment.role == 'teacher') {
        updatedLec = req.body
        try {
            await db.Lecture.update(
                updatedLec,     // provided body from request
                { where: { id: lectureId } }
            )
        }
        catch (e) {
            res.status(400).send({error: "Unable to update lecture object"})
            return
        }
        res.status(200).send()   // all good, return updated lecture object
    }
    else {      // if user is not a teacher
        res.status(403).send()
    }
})

router.get('/:lecture_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const lectureId = req.params.lecture_id
    const courseId = req.params.course_id
    const enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)
    const lecture = await getLecture(lectureId)
    var full_response = {}  // will hold response with lecture info and related questions

    if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
        return
    }
    else if (lecture == null) {
        res.status(404).send({error: "Lecture of this id does not exist"})
        return
    }
    else if (enrollment.role == 'teacher') {     // if teacher, send lecture info & all related questions
        try {
            full_response['lecture'] = lecture
            const questions_in_lec = await db.sequelize.query(  // raw sql query to get all questions in this lecture using `QuestionInLecture`
                `SELECT q.* FROM Questions q INNER JOIN QuestionInLectures ql ON q.id = ql.questionId INNER JOIN Lectures l ON ql.lectureId = l.id WHERE l.id = ${lectureId}`,
                {
                    type: db.sequelize.QueryTypes.SELECT
                }
            )
            full_response['questions'] = questions_in_lec
        }
        catch (e) {
            res.status(400).send({error: "Unable to get lecture or questions"})
            return
        }
        res.status(200).send(full_response)
    }
    else {  // if student, only send published info
        let sectionLectureRelation = await getSectionLectureRelation(lectureId, enrollment.sectionId)
        if (sectionLectureRelation == null) {
            res.status(404).send({error: "This lecture does not exist in your section"})
        }
        else if (!sectionLectureRelation.published) {    // if this lecture (from user's section) isn't published
            res.status(404).send({error: "This lecture is not yet published"})
        }
        else {  // if this lecture (from user's section) is published
            try {
                const lecture = await getLecture(lectureId)
                full_response['lecture'] = lecture
    
                const questions_in_lec = await db.sequelize.query(  // raw sql query to get all published questions in this lecture using `QuestionInLecture`
                    `SELECT DISTINCT q.* FROM Questions q INNER JOIN QuestionInLectures ql ON q.id = ql.questionId INNER JOIN Lectures l ON ql.lectureId = l.id WHERE ql.published = 1 AND l.id = ${lectureId}`
                )
                full_response['questions'] = questions_in_lec[0]    // index 0, because query above returns 2 duplicate instances of result
            }
            catch (e) {
                res.status(400).send({error: "Unable to get lecture or questions"})
                return
            }
            res.status(200).json(full_response)   // all good, return updated lecture object
        }
    }
})

// delete lecture and ALL relations to this lecture
router.delete('/:lecture_id', requireAuthentication, async function (req, res) {
    const user = await db.User.findByPk(req.payload.sub)
    const lectureId = req.params.lecture_id
    const courseId = req.params.course_id
    const enrollment = await getEnrollmentFromCourse(user.id, courseId) || await getEnrollmentFromSectionInCourse(user.id, courseId)
    const lecture = await getLecture(lectureId)
    
    if (lecture == null) {
        res.status(204).send({error: "This lecture does not exist already"})
        return
    }
    else if (enrollment == null) {   // if user is not enrolled in this course
        res.status(403).send()
        return
    }
    else if (enrollment.role != 'teacher') {
        res.status(403).send()
        return
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
            res.status(400).send({error: "Unable to delete lecture"})
            return
        }
        res.status(200).send()
    }
})

module.exports = router
