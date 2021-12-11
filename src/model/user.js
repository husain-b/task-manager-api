const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = mongoose.Schema({
    name : {
    type : String,
    trim : true
  },
    email : {
        type : String,
        trim : true,
        lowercase : true,
        required : true,
        unique : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email");
            }
        }
    },
    password : {
        type : String,
        required: true,
        trim : true,
        minLength : 6,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error('Password should not contain "password"');
            }
        }
    },
    age : {
        type : Number,
        trim : true,
        default : 0,
        validate(value){
            if(value < 0){
                throw new Error("Age cannot be negative");
            }
        }
    },
    role : {
        type : String,
        default : 'consumer'
    },
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }],
    avatar : {
        type : Buffer
    }
},
    {
    timestamp : true
});

userSchema.virtual('tasks',{
    ref : 'Task',
    localField : '_id',
    foreignField : 'owner'
})

userSchema.methods.toJSON = function(){
    const user = this

    const userObject = user.toObject()

    delete userObject.role
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function (){
    const user = this;
    const token = jwt.sign({_id : user._id.toString()},process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({token})
    return token;
}


userSchema.statics.findByCreds = async (email,password) => {
    
    const user = await User.findOne({email});

    if(!user){
        throw new Error('Incorrect Email or Password');
    }

    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch){
        throw new Error('Incorrect Email or Password');
    }

    return user;
}

userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({owner : user._id})
    next()
})

userSchema.pre('save', async function (next){
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    next();
})

const User = mongoose.model('User', userSchema);


module.exports = User;