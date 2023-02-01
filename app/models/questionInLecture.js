'use strict'

module.exports = (sequelize, DataTypes) => {
    const QuestionInLecture = sequelize.define('QuestionInLecture', {
        // the id column should be standardized across all models
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        questionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Questions',
                key: 'id'
            },
            validate: {
                notNull: {
                    msg: 'QuestionInLecture must have a question'
                }
            }
        },
        lectureId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Lectures',
                key: 'id'
            },
            validate: {
                notNull: {
                    msg: 'QuestionInLecture must have a lecture'
                }
            }
        },
        order: {
            type: DataTypes.INTEGER
        },
        published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    },
    {
        timestamps: true,
        indexes: [
            {
                name: 'custom_unique_question_in_lectures_order_constraint',
                unique: true,
                fields: ['lectureId', 'order']
            }
        ],
        hooks: {
            beforeCreate: async (questionInLecture) => {
                if (questionInLecture.order == null) {  // if lecture order isn't passed in
                    const curr_max_order = await QuestionInLecture.max('order', {     // get the current max order number for this course
                        where: {
                            lectureId: questionInLecture.lectureId
                        }
                    })
        
                    if (curr_max_order == null) {  // if no order was found (first entry for this course)
                        questionInLecture.order = 0;
                    }
                    else {  // if there is an entry for this course, get appropriate order number
                        questionInLecture.order = curr_max_order + 1
                    }
                }
            }
        }
    })

    QuestionInLecture.assoociate = (models) => {
        QuestionInLecture.belongsTo(models.Lecture)
        QuestionInLecture.belongsTo(models.Question)
    }

    return QuestionInLecture
}