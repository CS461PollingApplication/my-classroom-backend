const app = require('../../../app/app')
const db = require('../../../app/models')
const { generateUserAuthToken } = require('../../../lib/auth')
const request = require('supertest')


describe('api/sections tests', () => {
    let teacherToken
    let studentToken
    let course1
    let section1


    beforeAll(async() => {
        const teacher = await db.User.create({
            firstName: 'Dan',
            lastName: 'Smith',
            email: 'dannySmith@myclassroom.com',
            rawPassword: 'Danny-o123!'
        })
        teacherToken = generateUserAuthToken(teacher)
        
        const student = await db.User.create({
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
        it('should respond with 400 for creating a section with already existing number', async () => {
            const resp = await request(app).post(`/courses/${course1.id}/sections`).send({
                number: 1
            }).set('Authorization', `Bearer ${teacherToken}`)

            expect(resp.statusCode).toEqual(400)
        })

        it('should respond with 400 for creating a section with missing value', async () => {
            const resp = await request(app).post(`/courses/${course1.id}/sections`).send({
            }).set('Authorization', `Bearer ${teacherToken}`)

            expect(resp.statusCode).toEqual(400)
        })

        it('should respond with 403 for creating a section as a student', async () => {
            const resp = await request(app).post(`/courses/${course1.id}/sections`).send({
                number: 2
            }).set('Authorization', `Bearer ${studentToken}`)

            expect(resp.statusCode).toEqual(403)
        })

        it('should respond with 201 for successfully creating section', async () => {
            const resp = await request(app).post(`/courses/${course1.id}/sections`).send({
                number: 2
            }).set('Authorization', `Bearer ${teacherToken}`)

            expect(resp.statusCode).toEqual(201)
            expect(resp.body.section.courseId).toEqual(course1.id)
            expect(resp.body.section.number).toEqual(2)
        })
    })

    describe('GET /courses/:course_id/sections/:section_id', () => {
        it('should respond with 404 for getting a course with bad section id', async () => {
            const resp = await request(app).get(`/courses/${course1.id}/sections/${-1}`).set('Authorization', `Bearer ${teacherToken}`)

            expect(resp.statusCode).toEqual(404)
        })

        it('should respond with 403 for getting a course as a student', async () => {
            const resp = await request(app).get(`/courses/${course1.id}/sections/${section1.id}`).set('Authorization', `Bearer ${studentToken}`)

            expect(resp.statusCode).toEqual(403)
        })

        it('should respond with 200 for successfully getting a course with provided lecture', async () => {
            // create lecture
            const temp_lec = await db.Lecture.create({
                title: 'question set 1',
                order: 1,
                description: 'intro qs',
                courseId: course1.id
            })
            // associate lecture with section
            await db.LectureForSection.create({
                lectureId: temp_lec.id,
                sectionId: section1.id,
            })
            
            const resp = await request(app).get(`/courses/${course1.id}/sections/${section1.id}`).set('Authorization', `Bearer ${teacherToken}`)
            
            expect(resp.statusCode).toEqual(200)
            expect(resp.body.section.id).toEqual(section1.id)
            expect(resp.body.section.number).toEqual(section1.number)
            expect(resp.body.section.joinCode).toEqual(section1.joinCode)
            expect(resp.body.lectures.length).toEqual(1)
            expect(resp.body.lectures[0].id).toEqual(temp_lec.id)
            expect(resp.body.lectures[0].title).toEqual(temp_lec.title)
        })
    })

    describe('PUT /courses/:course_id/sections/:section_id', () => {
        
        let sectionToUpdate
        beforeAll(async() => {
            sectionToUpdate = await db.Section.create({
                number: 3,
                courseId: course1.id
            })
        })
        
        it('should respond with 400 for updating section with conflicting number', async () => {
            const resp = await request(app).put(`/courses/${course1.id}/sections/${sectionToUpdate.id}`).send({
                number: 1
            }).set('Authorization', `Bearer ${teacherToken}`)  
            
            expect(resp.statusCode).toEqual(400)
        })

        it('should respond with 400 for updating section with empty number', async () => {
            const resp = await request(app).put(`/courses/${course1.id}/sections/${sectionToUpdate.id}`).send({
                number: ""
            }).set('Authorization', `Bearer ${teacherToken}`)  
            
            expect(resp.statusCode).toEqual(400)
        })

        it('should respond with 400 for updating section with no number', async () => {
            const resp = await request(app).put(`/courses/${course1.id}/sections/${sectionToUpdate.id}`).send({
            }).set('Authorization', `Bearer ${teacherToken}`)  
            
            expect(resp.statusCode).toEqual(400)
        })
    
        it('should respond with 404 for updating section invalid id', async () => {
            const resp = await request(app).put(`/courses/${course1.id}/sections/${-1}`).send({
                number: 4
            }).set('Authorization', `Bearer ${teacherToken}`)  
            
            expect(resp.statusCode).toEqual(404)
        })

        it('should respond with 403 for updating section as a student', async () => {
            const resp = await request(app).put(`/courses/${course1.id}/sections/${sectionToUpdate.id}`).send({
                number: 4
            }).set('Authorization', `Bearer ${studentToken}`)  
            
            expect(resp.statusCode).toEqual(403)
        })

        it('should respond with 200 for successfully updating section', async () => {       
            const resp = await request(app).put(`/courses/${course1.id}/sections/${sectionToUpdate.id}`).send({
                number: 4
            }).set('Authorization', `Bearer ${teacherToken}`)  

            expect(resp.statusCode).toEqual(200)
            
            // check if section was updated
            const check_sec = await db.Section.findOne({
                where: { id: sectionToUpdate.id }
            })
            expect(check_sec.number).toEqual(4)         
        })
    })
})