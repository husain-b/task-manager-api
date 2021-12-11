const jwt = require('jsonwebtoken');
const User = require('../model/user');

const auth = async (req,res,next) => {
    try{
        const token = req.header('Authorization').replace('Bearer ','');
        const decoded = jwt.verify(token,'fortisfortunaadiuvat');
        const user = await User.findOne({_id : decoded._id, 'tokens.token' : token})
        if(!user){
            throw new Error();
        }
        req.user = user;
        req.token = token
        next()
        
    }catch(e){
        res.status(401).send('Please authorize');
    }
    
}

const authBeforeDeleteAll = async () => {

}

module.exports = auth;