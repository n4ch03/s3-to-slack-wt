'use latest';
/* express app as a webtask */

import Express from 'express'
import {fromExpress} from 'webtask-tools'
import {json} from 'body-parser'
import AWS from 'aws-sdk'; 


let app = Express();

app.use(json());

// GET
app.get('/getFiles', (req, res) => {
  
  AWS.config.update({accessKeyId: req.webtaskContext.secrets.AWS_ACCESS_KEY_ID, secretAccessKey:req.webtaskContext.secrets.AWS_SECRET_ACCESS_KEY});
  let s3 = new AWS.S3();
  const channel = req.query.channel;
  const token = req.headers.slack_token;
  const params = {
    Bucket: req.webtaskContext.secrets.AWS_BUCKET,
    Prefix: 'functional-tests-experimental/94'
  };
  console.log(params);
  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      res.json({ error: err });
    } else {     
      var results = [];
      data.Contents.forEach((obj) => {
        results.push(obj.Key);
      });
      res.json({ 'results': results });
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
