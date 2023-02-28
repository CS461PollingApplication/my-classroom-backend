const app = require('../../../app/app')
const db = require('../../../app/models')
const { generateUserAuthToken } = require('../../../lib/auth')
const request = require('supertest')


describe('api/sections tests', () => {
    let teacher, teacherToken
    let student, studentToken
    let course1
    let section1


    beforeAll(async() => {
        teacher = await db.User.create({
            firstName: 'Dan',
            lastName: 'Smith',
            email: 'dannySmith@myclassroom.com',
            rawPassword: 'Danny-o123!'
        })
        teacherToken = generateUserAuthToken(teacher)
        
        student = await db.User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@myclassroom.com',
            rawPassword: 'superdupersecret'
        })
        studentToken = generateUserAuthToken(student)

        course1 = await db.Course.create({
            name: 'Capstone Course',
            description: 'Exploited labor'
        })

        section1 = await db.Section.create({
            number: 1,
            joinCode: "xyz123",
            courseId: course1.id
        })

        await db.Enrollment.create({
            role: "teacher",
            courseId: course1.id,
            userId: teacher.id
        })

        await db.Enrollment.create({
            role: "student",
            sectionId: section1.id,
            userId: student.id
        })
    })

    describe('POST /courses/:course_id/sections', () => {
        it('should respond 400 for creating a section with already existing number', async () => {
            const resp = await request(app).post(`/courses/${course1.id}/sections`).send({
                courseId: course1.id,
                number: 1
                // joinCode: "joinjoinjoin"
            }).set('Authorization', `Bearer ${teacherToken}`)

            expect(resp.statusCode).toEqual(400)
        })

    })

})