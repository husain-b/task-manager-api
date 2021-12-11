const express = require('express');
const router = new express.Router();
const Task = require('../model/task');
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req,res)=>{

    //using async await -- alternative to promoise chaining

    const task = new Task({
        ...req.body,
        owner : req.user._id
    })
    try{
        await task.save();
        res.status(201).send(task);
    }catch(e){
        res.status(500).send();
    }
    
    // task.save().then(_task=>{
    //     res.status(201).send(_task);
    // }).catch(err=>{
    //     res.status(400).send(err);
    // })

})

router.patch('/tasks/:id',auth, async (req,res)=>{
    const validUpdates = ['description','completed'];
    const updates = Object.keys(req.body);
    const filteredInvalidUpdates = updates.filter(update => {return !validUpdates.includes(update)})

    if(filteredInvalidUpdates.length > 0){
        res.status(400).send( {'Invalid Properties' : filteredInvalidUpdates})
    }
    try{
        // const task = await Task.findByIdAndUpdate(req.params.id,req.body,{new : true , runValidators : true})
        const task = await Task.findOne({_id : req.params.id, owner : req.user._id})
        if(!task){
            res.status(404).send();
        }

        updates.forEach(update => task[update] = req.body[update])

        await task.save()

        res.status(201).send(task);

    }catch(e){
        res.status(500).send(e)
    }
    
    
})

//Get /tasks?completed=true
//Get /tasks?limit=10&skip=20
//Get /tasks?sortBy=createdAt:desc
router.get('/tasks',auth, async (req,res)=>{

     //using async await -- alternative to promoise chaining

     const match = {}
     const sort = {}
     if(req.query.completed){
         match.completed = req.query.completed === 'true'
     }
     if(req.query.sortBy){
         const parts = req.query.sortBy.split(':');
         sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
     }

     try{
         //const tasks = await Task.find({});
         await req.user.populate({
             path : 'tasks',
             match : match,
             options : {
                 limit : parseInt(req.query.limit) || null,
                 skip : parseInt(req.query.skip) || null,
                 sort : sort
             }
         })
         if(req.user.tasks.length < 0){
            res.send('No tasks found')
         }
         res.send(req.user.tasks);
     }catch(e){
         res.status(500).send();
     }

    // Task.find({}).then(tasks=>{
    //     res.send(tasks);
    // }).catch(err=>{
    //     res.status(500).send();
    // })
})

router.get('/tasks/:id',auth, async (req,res)=>{
    const _id = req.params.id;

     //using async await -- alternative to promoise chaining

     try{
         const task = await Task.findOne({_id,owner : req.user._id});
         if(!task){
             return res.status(404).send()
         }
         res.send(task);
     }catch(e){
         res.status(404).send('No task found for the id : ' + _id)
     }

    // Task.findById(_id).then(task=>{
    //     res.send(task);
    // }).catch(err=>{
    //     res.status(404).send('Task not Found')
    // })
})

router.delete('/tasks/:id', auth, async(req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id : req.params.id, owner : req.user._id});
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e);
    }
})

module.exports = router;