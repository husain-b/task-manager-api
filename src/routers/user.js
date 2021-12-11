const { application } = require('express');
const express = require('express');
const User = require('../model/user')
const router = new express.Router();
const auth = require('../middleware/auth')
const sharp = require('sharp')

const multer = require('multer');
const { sendWelcomeEmail, sendGoodByeEmail } = require('../emails/account');

const upload = multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error('Please upload an image file'))
        }
        cb(undefined,true)
    }
})

router.get('/users/me', auth,  async (req,res)=>{

    //using async await -- alternative to promoise chaining

        // const users = await User.find({});
        // if(users.length < 0){
        //     return res.send('No users found')
        // }
        // res.send(users);
        res.send(req.user);  



})

router.post('/users/me/avatar',auth,upload.single('upload'),async(req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width : 250, height :250}).png().toBuffer();
    req.user.avatar = buffer;
    
    await req.user.save()
    res.send()
},(err,req,res,next)=>{
    res.status(400).send({error : err.message})
})

router.get('/users/:id/avatar',async(req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-type','image/png').send(user.avatar)
    }catch(e){
        res.status(404).send()
    }
    

})

router.delete('/users/avatar/me', auth, upload.single('avatar'),async (req,res)=>{
    // const user = await User.findByIdAndUpdate(req.user._id,{avatar : undefined})
    // console.log(user)
    req.user.avatar = undefined
    await req.user.save()
    res.send()
},(err,req,res,next)=>{
    res.status(500).send(e)
})

router.get('/users',auth,async(req,res)=>{
    if(!(req.user.role === 'admin')){
        return res.status(401).send('Not authorized')
    }
    try{
        const users = await User.find({});
        res.send(users)
    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/users/getUser',auth,async (req,res)=>{

    //using async await -- alternative to promoise chaining
    try{
        if(!(req.user.role === 'admin')){
            return res.status(401).send()
        }
        const user = await User.findOne({email : req.body.email});
        res.send(user);
    }catch(e){
        res.status(404).send('No user found with the email : ' + req.body.email);
    }

    // User.findById(_id).then(user=>{
    //     res.send(user);
    // }).catch(err=>{
    //     res.status(404).send('User not found');
    // })
})

router.patch('/users/updateUser', auth, async (req,res)=> {
    const updates = Object.keys(req.body);

    try{
        // const user = await User.findByIdAndUpdate(req.params.id,req.body,{new : true, runValidators : true});
        if(!(req.user.role === 'admin')){
            return res.status(401).send('You dont have rights to perform this opeartion')
        }
        const user = await User.findOne({email : req.body.email});
        if(!user){
            return res.status(404).send();
        }
        updates.forEach(update => user[update] = req.body[update]);
        await user.save();
        res.send(user);

    }catch(e){
        res.status(500).send(e)
    }
})

router.patch('/users/me', auth, async (req,res)=> {
    const validUpdates = ['name','email','age','password'];
    const updates = Object.keys(req.body);
    const filteredInvalidUpdates = updates.filter(update => {return !validUpdates.includes(update)})

    if(filteredInvalidUpdates.length > 0){
        return res.status(400).send( {'Invalid Update values' : filteredInvalidUpdates})
    }

    try{
        // const user = await User.findByIdAndUpdate(req.params.id,req.body,{new : true, runValidators : true});
        // const user = await User.findById(req.params.id);
        // if(!user){
        //     return res.status(404).send();
        // }
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    }catch(e){
        res.status(500).send(e)
    }
})

//Create User
router.post('/users', async (req,res)=>{
    const validUpdates = ['name','email','age','password'];
    const updates = Object.keys(req.body);
    const filteredInvalidUpdates = updates.filter(update => {return !validUpdates.includes(update)})

    if(filteredInvalidUpdates.length > 0){
        return res.status(400).send( {'Invalid Properties' : filteredInvalidUpdates})
    }
    const user = new User(req.body);

    try{
        if(!user.name){
            user.name = user.email.substr(0,user.email.indexOf('@'))
        }
        const token = await user.generateAuthToken();
        await user.save();
        sendWelcomeEmail(user.email,user.name)
        res.status(201).send({user,token});
    }catch(e){
        res.status(500).send(e)
    }
    
    // user.save().then(usr=>{
    //     res.status(201).send(usr);
    // }).catch(err=>{
    //     res.status(400).send(err);
    // });
})

router.post('/users/login', async (req,res)=>{
    try{
        const user = await User.findByCreds(req.body.email,req.body.password);
        if(!user){
           return res.status(404).send()
        }

        const token = await user.generateAuthToken();
        await user.save()
        res.send({user,token});
    }catch(e){
        res.status(400).send(e);
    }

})

router.post('/users/logout', auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter(el=>{
            return !el.token === req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter(el => false);
        await req.user.save()
        res.send();
    }catch(e){
        res.status(500).send();
    }
})

//delete all users except admin
router.delete('/users', auth,async (req,res)=>{

    //using async await -- alternative to promoise chaining
    
    try{
        if(!(req.user.role === 'admin')){
            return res.status(401).send('You dont have rights to perform this opeartion')
        }
        const result = await User.deleteMany({role : {$ne : 'admin'}});
        res.send(result.deletedCount + ' users deleted')
    }catch(e){
        res.status(500).send()
    }

    // User.deleteMany({}).then(result=>{
    //     const deletedCount = result.deletedCount;
    //     res.send(deletedCount + ' users deleted');
    // }).catch(err=>{ 
    //     res.status(500)
    // })
})
 

router.post('/users/deleteUser',auth, async (req,res)=> {
    
    try{
        if(!(req.user.role === 'admin')){
            return res.status(401).send('You are not authorized to perform this operation')
        }
        const user = await User.findOne({email : req.body.email});

        if(!user){
           return  res.status(404).send();
        }
        await user.remove()
        res.send(user);
    }catch(e){
        res.status(500).send();
    }
   
})

//delete me
router.delete('/users/me',auth, async (req,res)=> {
    
    try{
        
        // const user = await User.findByIdAndDelete(req.params.id);

        // if(!user){
        //     res.status(404).send();
        // }

        await req.user.remove()
        sendGoodByeEmail(req.user.email,req.user.name)
    
        res.send(req.user);
    }catch(e){
        res.status(500).send();
    }
   
},(err,req,res,next)=>{
   console.log(err)
})

module.exports = router;