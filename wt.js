'use latest';
/* express app as a webtask */

import Express from 'express';
import {fromExpress} from 'webtask-tools';
import {json} from 'body-parser';
import AWS from 'aws-sdk'; 
import Slack from 'slack-node';

let attachments = [];


let app = Express();

app.use(json());


// GET
app.get('/slack', (req, res) => {
  console.log(req.webtaskContext.secrets.SLACK_TOKEN);
  let slackClient = new Slack(req.webtaskContext.secrets.SLACK_TOKEN);
  slackClient.api('chat.postMessage', {
    text:'from webtask',
    channel:'#test-automation-fo',
    attachments: 	'[{"pretext": "pre-hello", "text": "text-world"}]'
  }, function(err, response){
    console.log(response);
    res.send('OK!');    
  });
});


// GET
app.get('/getFiles', (req, res) => {
  AWS.config.update({accessKeyId: req.webtaskContext.secrets.AWS_ACCESS_KEY_ID, secretAccessKey:req.webtaskContext.secrets.AWS_SECRET_ACCESS_KEY});
  let s3 = new AWS.S3();
  const path = req.query.path || '';
  const params = {
    Bucket: req.webtaskContext.secrets.AWS_BUCKET,
    Prefix: path
  };
  console.log(params);
  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.json({ error: err });
    } else {     
      var results = [];
      data.Contents.forEach((obj) => {
        let fname = obj.Key;
        results.push(fname);
        attachments.push({
            "title": fname.replace(path + '/', ''),
            "title_link": "https://webtask.it.auth0.com/api/run/wt-iesmite-gmail_com-0/doppio-image/file?path="+fname,
            "mrkdwn_in": ["text"]
        });

      });
      let slackClient = new Slack(req.webtaskContext.secrets.SLACK_TOKEN);
      slackClient.api('chat.postMessage', {
        text:'Screenshots for failed tests :facepalm:',
        channel:'#test-automation-fo',
        "attachments": 	JSON.stringify(attachments)
      }, function(err, response){
        console.log(response);
        res.send('OK!');    
      });
    }  
  });
});


app.get('/file', (req, res) => {
  const path = req.query.path;
  AWS.config.update({accessKeyId: req.webtaskContext.secrets.AWS_ACCESS_KEY_ID, secretAccessKey:req.webtaskContext.secrets.AWS_SECRET_ACCESS_KEY});
  let s3 = new AWS.S3();
  
  console.log(path);
  const params = {
    Bucket: req.webtaskContext.secrets.AWS_BUCKET,
    Key: path
  };
  
  /*s3.getObject(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.json({ error: err });
    } else  {
      console.log(data);
      res.pipe(data.Body);
    }
  });*/
  let imgStream = s3.getObject(params).createReadStream();
  imgStream.pipe(res);
  
});


// expose this express app as a webtask-compatible function
module.exports = fromExpress(app);
