const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email,name) => {
    sgMail.send({
        to : email,
        from : 'husain4598@gmail.com',
        subject : 'Greetings!!',
        text : 'Welcome '+ name + '! Thanks for joining in, let us know how you get along with App'
    })
   
}

const sendGoodByeEmail = (email,name) => {
    sgMail.send({
        to : email,
        from : 'husain4598@gmail.com',
        subject : 'Sorry to see you go!',
        text : `Goodbyee!! ${name}, I hope we see you back sometime soon`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodByeEmail
}