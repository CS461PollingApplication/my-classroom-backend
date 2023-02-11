// const app = require('../../../app/app')
// const request = require('supertest')
// const db = require('../../../app/models/index')

// describe('GET /courses/:course_id/lectures', () => {

//     beforeAll(async () => {

//         // create sample models for tests
//         const course = await db.Course.create({
//             name: 'Capstone Course',
//             description: 'Exploited labor'
//         })
//         const teacher = await db.User.create({
//             firstName: 'Dan',
//             lastName: 'Smith',
//             email: 'danSmith2@myclassroom.com',
//             rawPassword: 'Danny-o123!',
//         })
//         const teacherToken = teacher.body.token
//         const student = await db.User.create({
//             firstName: 'John',
//             lastName: 'Doe',
//             email: 'johndoe@myclassroom.com',
//             rawPassword: 'superdupersecret',
//             confirmedPassword: "superdupersecret"
//         })
//         const studentToken = student.body.token
//         const enrollment1 = await db.Enrollment.create({
//             role: "teacher",
//             courseId: course.id,
//             userId: teacher.id
//         })
//         const enrollment2 = await db.Enrollment.create({
//             role: "student",
//             courseId: course.id,
//             userId: student.id
//         })
//         const lecture1 = await db.Lecture.create({
//             title: 'question set 1',
//             order: 1,
//             description: 'intro qs',
//             courseId: course.id
//         })

//         // const section1 = await db.Section.create({
//         //     number: 1,
//         //     joinCode: "xyz123",
//         //     courseId: course.id
//         // })
//         // const section2 = await db.Section.create({
//         //     number: 2,
//         //     joinCode: "abc789",
//         //     courseId: course.id
//         // })

//         // const lecture2 = await db.Lecture.create({
//         //     title: 'question set 2',
//         //     order: 2,
//         //     description: 'intermediate qs',
//         //     courseId: course.id
//         // })
//         // const question1 = await db.Question.create({
//         //     type: 'multiple choice',
//         //     stem: 'What is 1 + 2?',
//         //     content: {
//         //         options: {
//         //             0: 2,
//         //             1: 3,
//         //             2: 4,
//         //             3: 5
//         //         }
//         //     },
//         //     answers: {
//         //         0: false,
//         //         1: true,
//         //         2: false,
//         //         3: false
//         //     },
//         //     courseId: course.id
//         // })
//         // const question2 = await db.Question.create({
//         //     type: 'multiple choice',
//         //     stem: 'What is 5 + 5?',
//         //     content: {
//         //         options: {
//         //             0: 5,
//         //             1: 6,
//         //             2: 7,
//         //             3: 10
//         //         }
//         //     },
//         //     answers: {
//         //         0: false,
//         //         1: false,
//         //         2: false,
//         //         3: true
//         //     },
//         //     courseId: course.id
//         // })
//         // const enrollment2 = await db.Enrollment.create({
//         //     role: "student",
//         //     courseId: course.id,
//         //     userId: student.id
//         // })

//         // // create relationship entries for sample models
//         // const lec1_sec1 = await db.LectureForSection.create({
//         //     lectureId: lecture1.id,
//         //     sectionId: section1.id,
//         //     published: true
//         // })
//         // const lec1_sec2 = await db.LectureForSection.create({
//         //     lectureId: lecture1.id,
//         //     sectionId: section1.id,
//         //     published: false
//         // })
//     })
    
//     it('should respond 204 for a student in unpublished course', async () => {
//         const resp = await request(app).get('/courses/:course_id/lectures').set('Authorization', `Bearer ${studentToken}`)
        
//         expect(resp.statusCode).toEqual(201)
//         // expect(resp.body.user.firstName).toEqual("Memey")
//         // expect(resp.body.user.lastName).toEqual("Meme")
//         // expect(resp.body.user.email).toEqual("MemeyMeme@myclassroom.com")
//         // expect(resp.body.token).toBeTruthy()
//     })


//     afterAll(async () => {
//         await course.destroy()
//         await teacher.destroy()
//         await student.destroy()
//         await enrollment1.destroy()
//         await enrollment2.destroy()
//         await lecture1.destroy()
//     })
// })