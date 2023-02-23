const router = require('express').Router()
const db = require('../models')
const { generateUserAuthToken, requireAuthentication } = require('../../lib/auth')

//Teacher wants to view a question inside a lecture 
//GET /courses/:course_id/sections/:section_id/lectures/:lecture_id/questions/:question_id
router.get('/:question_id', requireAuthentication, async function (req, res) {
    //authenticate user
    const user = await db.User.findByPk(req.payload.sub)
    const courseId = req.params.course_id
    const sectionId = req.params.section_id
    const lectureId = req.params.lecture_id
    const questionId = req.params.question_id

    //check if the user is a teacher
    //get enrollment
    const enrollment = await db.Enrollment.findOne({
        where: {
            userId: user.id,
            courseId: courseId
        }
    })
    if(enrollment == NULL){
        res.status(403).send({error: "User not enrolled in course"})
    }
    else if(enrollment.role != 'teacher'){
        res.status(403).send({error: "User not a teacher"})
    }
    else{ //passes tests
        try{
            //grab the question from the database
            const question = await db.sequelize.findOne({
                where: {id: questionId, courseId: courseId}
            })
            res.status(200).send({
                question : question
            })
        }
        catch (e){
            res.status(400).send({error: "Unable to get question"})
            return
        }
    }
})

//PUT /courses/:course_id/sections/:section_id/lectures/:lecture_id/questions/:question_id
//teacher wants top unpublish a question in the lecture 
//

module.exports = router