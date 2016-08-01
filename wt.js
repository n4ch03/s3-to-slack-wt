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
app.get('/getFiles', (req, res) => {
  AWS.config.update({accessKeyId: req.webtaskContext.secrets.AWS_ACCESS_KEY_ID, secretAccessKey:req.webtaskContext.secrets.AWS_SECRET_ACCESS_KEY});
  let s3 = new AWS.S3();
  const path = req.query.path || 'functional-tests/4979';
  const channel = '#' + (req.query.channel || 'test-automation-fo');
  console.log(`Path is: ${path}`);
  console.log(`Channel is: ${channel}`);

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
        const fnameUrl = fname.replace('+', '%2b');
        attachments.push({
            "title": fname.replace(path + '/', ''),
            "title_link": `https://webtask.it.auth0.com/api/run/${req.x_wt.container}/${req.x_wt.jtn}/file?path=${fnameUrl}`,
            "mrkdwn_in": ["text"],
            "color": "#e60b25",
        });
      });
      let slackClient = new Slack(req.webtaskContext.secrets.SLACK_TOKEN);
      const splittedPath = path.split('/');
      const message = `${splittedPath[0]}, build: ${splittedPath[1]} : ${req.webtaskContext.secrets.SLACK_MESSAGE}`;

      if (attachments.length > 0) {
        slackClient.api('chat.postMessage', {
          text:message,
          channel: channel,
          "attachments": 	JSON.stringify(attachments)
        }, function(err, response){
          console.log(response);
          res.json({ ok: 'OK!' });
        });
      } else {
        res.json({ ok: 'OK: No tests to send!' });
      }
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

  let imgStream = s3.getObject(params).createReadStream();
  imgStream.pipe(res);
  
});

app.get('/listByPath', (req, res) => {
  AWS.config.update({accessKeyId: req.webtaskContext.secrets.AWS_ACCESS_KEY_ID, secretAccessKey:req.webtaskContext.secrets.AWS_SECRET_ACCESS_KEY});
  let s3 = new AWS.S3();
  const path = req.query.path || 'functional-tests/4979';

  const params = {
    Bucket: req.webtaskContext.secrets.AWS_BUCKET,
    Prefix: path
  };

  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.json({ error: err });
    } else {     
      var results = [];
      data.Contents.forEach((obj) => {
        let key  = obj.Key.replace('+', '%2b');
        results.push({
          'key': obj.Key,
          'delete': `https://webtask.it.auth0.com/api/run/${req.x_wt.container}/${req.x_wt.jtn}/deleteByKey?key=${obj.Key}`
        });
      });
      res.json(results);
    }  
  });
});

//Yes yes I know is not the right way is a get to a delete :)

app.get('/deleteByKey', (req, res) => {
  AWS.config.update({accessKeyId: req.webtaskContext.secrets.AWS_ACCESS_KEY_ID, secretAccessKey:req.webtaskContext.secrets.AWS_SECRET_ACCESS_KEY});
  let s3 = new AWS.S3();
  const key = req.query.key;

  const params = {
    Bucket: req.webtaskContext.secrets.AWS_BUCKET,
    Key: key
  };

  s3.deleteObject(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.json({ error: err });
    } else {     
      res.json({result: 'OK'});
    }
  });  
});

// expose this express app as a webtask-compatible function
module.exports = fromExpress(app);
