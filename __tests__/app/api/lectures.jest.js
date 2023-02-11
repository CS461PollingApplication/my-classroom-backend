const app = require('../../../app/app')
const request = require('supertest')
const db = require('../../../app/models/index')

// CURRENTLY: POST /users doesn't return userid which i may need to this test, should it return userid?

describe('GET /courses/:course_id/lectures', () => {

    let course, teacher_resp, teacher, teacherToken, student_resp, student, studentToken, 
    enrollment1, enrollment2, lecture1

    beforeAll(async () => {

        // create sample models for tests
        course = await db.Course.create({
            name: 'Capstone Course',
            description: 'Exploited labor'
        })
        teacher_resp = await request(app).post('/users').send({
            firstName: 'Dan',
            lastName: 'Smith',
            email: 'danSmith2@myclassroom.com',
            rawPassword: 'Danny-o123!',
            confirmedPassword: 'Danny-o123!'
        })
        console.log(teacher_resp)
        teacher = teacher_resp.body.user
        teacherToken = teacher_resp.body.token
        student_resp = await request(app).post('/users').send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@myclassroom.com',
            rawPassword: 'superdupersecret',
            confirmedPassword: 'superdupersecret'
        })
        student = student_resp.body.user
        studentToken = student_resp.body.token
        enrollment1 = await db.Enrollment.create({
            role: "teacher",
            courseId: course.id,
            userId: teacher.id
        })
        enrollment2 = await db.Enrollment.create({
            role: "student",
            courseId: course.id,
            userId: student.id
        })
        lecture1 = await db.Lecture.create({
            title: 'question set 1',
            order: 1,
            description: 'intro qs',
            courseId: course.id
        })

        // const section1 = await db.Section.create({
        //     number: 1,
        //     joinCode: "xyz123",
        //     courseId: course.id
        // })
        // const section2 = await db.Section.create({
        //     number: 2,
        //     joinCode: "abc789",
        //     courseId: course.id
        // })

        // const lecture2 = await db.Lecture.create({
        //     title: 'question set 2',
        //     order: 2,
        //     description: 'intermediate qs',
        //     courseId: course.id
        // })
        // const question1 = await db.Question.create({
        //     type: 'multiple choice',
        //     stem: 'What is 1 + 2?',
        //     content: {
        //         options: {
        //             0: 2,
        //             1: 3,
        //             2: 4,
        //             3: 5
        //         }
        //     },
        //     answers: {
        //         0: false,
        //         1: true,
        //         2: false,
        //         3: false
        //     },
        //     courseId: course.id
        // })
        // const question2 = await db.Question.create({
        //     type: 'multiple choice',
        //     stem: 'What is 5 + 5?',
        //     content: {
        //         options: {
        //             0: 5,
        //             1: 6,
        //             2: 7,
        //             3: 10
        //         }
        //     },
        //     answers: {
        //         0: false,
        //         1: false,
        //         2: false,
        //         3: true
        //     },
        //     courseId: course.id
        // })
        // const enrollment2 = await db.Enrollment.create({
        //     role: "student",
        //     courseId: course.id,
        //     userId: student.id
        // })

        // // create relationship entries for sample models
        // const lec1_sec1 = await db.LectureForSection.create({
        //     lectureId: lecture1.id,
        //     sectionId: section1.id,
        //     published: true
        // })
        // const lec1_sec2 = await db.LectureForSection.create({
        //     lectureId: lecture1.id,
        //     sectionId: section1.id,
        //     published: false
        // })
    })
    
    it('should respond 204 for a student in unpublished course', async () => {
        const resp = await request(app).get('/courses/:course_id/lectures').set('Authorization', `Bearer ${studentToken}`)
        
        expect(resp.statusCode).toEqual(204)
        // OTHER EXPECTATIONS...
    })


    afterAll(async () => {
        await course.destroy()
        await teacher_resp.destroy()
        await student_resp.destroy()
        await enrollment1.destroy()
        await enrollment2.destroy()
        await lecture1.destroy()
    })
})