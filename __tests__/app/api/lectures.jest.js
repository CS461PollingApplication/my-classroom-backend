const app = require('../../../app/app')
const request = require('supertest')
const db = require('../../../app/models/index')

async function getUserFromEmail(email) {
    return await db.User.findOne({
        where: {
            email: email
        }
    })
}

describe('GET /courses/:course_id/lectures', () => {
    let course, course_published, section1, section2, teacher_resp, teacher, teacherToken, student_resp, student, studentToken, unrelated_resp, unrelated, unrelatedToken, enrollment1, enrollment2, enrollment3, lecture1, lecture2
    
    beforeAll(async () => {
        // create sample models for tests
        course = await db.Course.create({
            name: 'Capstone Course',
            description: 'Exploited labor'
        })

        course_published = await db.Course.create({
            name: 'Databases',
            description: 'SQL, just SQL',
            published: true
        })

        section1 = await db.Section.create({
            number: 1,
            joinCode: "xyz123",
            courseId: course.id
        })

        section2 = await db.Section.create({
            number: 2,
            joinCode: "abc789",
            courseId: course_published.id
        })

        teacher_resp = await request(app).post('/users').send({
            firstName: 'Dan',
            lastName: 'Smith',
            email: 'danSmith2@myclassroom.com',
            rawPassword: 'Danny-o123!',
            confirmedPassword: 'Danny-o123!'
        })
        teacher = await getUserFromEmail(teacher_resp.body.user.email)  // used to get ID
        teacherToken = teacher_resp.body.token
        
        student_resp = await request(app).post('/users').send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@myclassroom.com',
            rawPassword: 'superdupersecret',
            confirmedPassword: 'superdupersecret'
        })
        student = await getUserFromEmail(student_resp.body.user.email)  // used to get ID
        studentToken = student_resp.body.token
        
        unrelated_resp = await request(app).post('/users').send({
            firstName: 'Software',
            lastName: 'Engineer',
            email: 'swe@myclassroom.com',
            rawPassword: 'secretpassword45',
            confirmedPassword: 'secretpassword45'
        })
        unrelated = await getUserFromEmail(unrelated_resp.body.user.email)  // used to get ID
        unrelatedToken = unrelated_resp.body.token

        enrollment1 = await db.Enrollment.create({
            role: "teacher",
            courseId: course.id,
            userId: teacher.id
        })
        enrollment2 = await db.Enrollment.create({
            role: "student",
            sectionId: section1.id,
            userId: student.id
        })
        enrollment3 = await db.Enrollment.create({
            role: "student",
            sectionId: section2.id,
            userId: student.id
        })

        lecture1 = await db.Lecture.create({
            title: 'question set 1',
            order: 1,
            description: 'intro qs',
            courseId: course.id
        })
        lecture2 = await db.Lecture.create({
            title: 'question set 2',
            order: 2,
            description: 'intermediate qs',
            courseId: course_published.id
        })

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
        const resp = await request(app).get(`/courses/${course.id}/lectures`).set('Authorization', `Bearer ${studentToken}`)
        
        expect(resp.statusCode).toEqual(204)
    })

    it('should respond with 401 for bad authorization token', async () => {
        const resp = await request(app).get(`/courses/${course.id}/lectures`).set('Authorization', `Bearer badbearedtoken:(`)
        
        expect(resp.statusCode).toEqual(401)
    })

    it('should respond with 403 for someone who is not in course', async () => {
        const resp = await request(app).get(`/courses/${course.id}/lectures`).set('Authorization', `Bearer ${unrelatedToken}`)
        
        expect(resp.statusCode).toEqual(403)
    })

    it('should respond with 200 and lecture details for teacher', async () => {
        const resp = await request(app).get(`/courses/${course.id}/lectures`).set('Authorization', `Bearer ${teacherToken}`)
    
        expect(resp.statusCode).toEqual(200)
        expect(resp.body.lecture.length).toEqual(1)
        expect(resp.body.lecture[0].title).toEqual('question set 1')
        expect(resp.body.lecture[0].order).toEqual(1)
        expect(resp.body.lecture[0].description).toEqual('intro qs')
        expect(resp.body.lecture[0].courseId).toEqual(course.id)
    })

    it('should respond with 200 and lecture details for student in published course', async () => {
        const resp = await request(app).get(`/courses/${course_published.id}/lectures`).set('Authorization', `Bearer ${studentToken}`)
    
        expect(resp.statusCode).toEqual(200)
        expect(resp.body.lecture.length).toEqual(1)
        expect(resp.body.lecture[0].title).toEqual('question set 2')
        expect(resp.body.lecture[0].order).toEqual(2)
        expect(resp.body.lecture[0].description).toEqual('intermediate qs')
        expect(resp.body.lecture[0].courseId).toEqual(course_published.id)
    })

    afterAll(async () => {
        await course.destroy()
        await course_published.destroy()
        await section1.destroy()
        await section2.destroy()
        await teacher_resp.destroy()
        await student_resp.destroy()
        await unrelated_resp.destroy()
        await enrollment1.destroy()
        await enrollment2.destroy()
        await lecture1.destroy()
        await lecture2.destroy()
    })
})