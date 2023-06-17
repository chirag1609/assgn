//Node.js based app that is able to respond to emails sent to your Gmail mailbox while you’re out on a vacation. 

//installing the necessary libraries nodemon - for restaring the server on making changes 
//nodemailer - for sending the mails and googleapis - to access the functions of gmail API

const { google } = require('googleapis')
const nodemailer = require('nodemailer')

// Gmail API credentials
const CLIENT_ID = '208204270970-oqhj7jr8072ra82o2uudqjvfjd1on36j.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'
const REFRESH_TOKEN = '1//04VzHfSUhqlSxCgYIARAAGAQSNgF-L9IrC0lKymxO12WlFxGebjh1EaRO0uCaIAnMikd3J-nvMkt7VnJL319Bz1BAb-9m4s3ugw'

// Create OAuth2 client
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)

// Set OAuth2 client credentials
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN})

//send email function
async function sendMail(){
    try{
        //get access token
        const accessToken = await oAuth2Client.getAccessToken()

        //creating nodemailer transport
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'oauth2',
                user: 'chiragmatta09@gmail.com',
                clientId : CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        })

        // Create Gmail API client
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Get unread threads from Gmail
        const response = await gmail.users.threads.list({
        userId: 'me',
        q: 'is:unread',
        }); 
    
        const threads = response.data.threads || [];
        
        //iterating over each thread
        for (const thread of threads) {
            const threadId = thread.id;
        
            // Get messages in the thread
            const threadResponse = await gmail.users.threads.get({ userId: 'me', id: threadId });
            const messages = threadResponse.data.messages || [];
        
            // Check if any replies are from the user 
            const hasRepliesFromMe = messages.some((msg) => msg.labelIds.includes('SENT'));
            
            if (!hasRepliesFromMe) {
                // Get sender email from the first message
                const senderEmail = messages[0].payload.headers.find((header) => header.name === 'From').value;
            
                //compose email
                const mailOptions = {
                    from: 'chiragmatta09@gmail.com',
                    to: senderEmail,
                    subject: "Hello from Gmail API",
                    text: 'Hello from gmail API',
                    html: "I am on my Vactaion"
                }

                // Send email
                await transport.sendMail(mailOptions);

                // Get message IDs
                const messageIds = messages.map((msg) => msg.id);
                console.log('Message IDs:', messageIds);
        
                //creating new label
                const labelToAdd = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show',
                    name: 'HelloTest',
                },
                });

                const labelId = labelToAdd.data.id;

                //Add label to messages
                await gmail.users.messages.modify({
                userId: 'me',
                ids: messageIds,
                requestBody: {
                    addLabelIds: [labelId],
                },
            });
        }
    }

    //repeat the sequence in 45-120 seconds
    const delay = getRandomDelay(45000, 120000);
    setTimeout(sendMail, delay);
    }catch(error){
        return error
    }
}
//function for the random delay
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
//sending emails
sendMail()

