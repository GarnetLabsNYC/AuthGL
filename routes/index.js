var express = require('express');
var router = express.Router();


//basic router

router.get('/', (req, res) => {
  res.render('index',{request: req});
});

module.exports = router;
