const { Router } = require('express')
const course = require('../models/course')
const router = Router()
const db = require('../models/index')
const { logger } = require('../services/logger')
const courseService = require('../services/course_service')

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

//User Creates a course
//Authenticate token, create course & create enrollment for logged in user as teacher in the course
router.post('/', async function (req, res) {
    //TODO: Authenticate token to find user 
    const user = await db.User.findOne({ // replace this with a find to get the user by id (available after authentication)
        where: { email: 'memer@myclassroom.com' }
    })
    
    //create course & role as a teacher in enrollment
    //create course 
    try{
        //change to use course_service.js with req.body
        //create the course
        const course = await db.Course.create(req.body)

        //create the enrollment
        //change to use course_service.js with req.body
        //use the userid, courseid we just recieved 
        const enrollment = await db.Enrollment.create(req.body, course.id, user.id, [])
        
        res.status(201).send({

        })
    }
    catch (e) {

    }

})

//User joins with course code
//Authenticate token & create enrollment for the user in the section that has a code 
router.post('/:joinCode', async function (req, res) {
    //TODO: Authenticate token to find user 
    const user = await db.User.findOne({ // replace this with a find to get the user by id (available after authentication)
        where: { email: 'memer@myclassroom.com' }
    })
})


module.exports = router