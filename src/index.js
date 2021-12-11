const express = require('express');

const app = express();
const port = process.env.PORT;
require('./db/mongoose');

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

//should be before all the app.use()
// app.use((req,res,next)=>{
//     res.status(503).send('Site is in maintenance..please standby');
// })

//converts json requests to javascript object
app.use(express.json());

//Routers 
app.use(userRouter);
app.use(taskRouter);


app.listen(port,()=>{
    console.log('Server is up and running at Port '+ port);
})

// const User = require('./model/user')
// const Task = require('./model/task')
// const stuff = async() => {
//     const user = await User.findById('61b1e78b7685b8dae702e522')
//     await user.populate('tasks')
//     console.log(user.tasks)
//     console.log(await Task.findById('61b1e8628ba74f0adb5910f1').populate('owner'))
// }

// stuff()






