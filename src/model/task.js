const mongoose = require('mongoose');
const taskSchema = mongoose.Schema({
    description : {
        type : String,
        required : true,
        trim : true
    },
    completed : {
        type : Boolean,
        default : false
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    }
},{
    timestamp : true
})



taskSchema.pre('save', async function(next){
    next()
})

const Task = mongoose.model('Task',taskSchema);

module.exports = Task;