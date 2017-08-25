var express = require('express');
var path = require('path');
var bunyan = require('bunyan');
var cp = require('cookie-parser');
var bp = require('body-parser');
var cjson = require('cjson');
var config = cjson.load('./config.json');
var mg = require('mongoose');
var ev = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var pp = require('passport');
var ls = require('passport-local').Strategy;
var mgdb = require('mongodb');
const options = {
    useMongoClient: true,
    server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
};
mg.connect(`mongodb://${config.database.dbUser}:${config.database.dbPass}@${config.database.dbServer}:${config.database.dbPort}/${config.database.dbName}`, options);

var db = mg.connection;


//initialize the port Var from either process, or manual

var port = process.env.PORT || 3000;

//Initialize Logger with preferred options. Think that this may need to be broken out later into it's own config file.
var logman = bunyan.createLogger({
  name: 'authgl',
  streams: [
    {
      level: 'info',
      stream: process.stdout,
      path: 'logs/auth.info.log'
    },
    {
      level: 'error',
      stream: process.stdout,
      path: 'logs/auth.err.log'
    },
    {
      level: 'fatal',
      stream: process.stdout,
      path: 'logs/auth.fatal.log'
    }
  ]
});

//Initialize the express app with cookie and body parsers injected.
var app = express();

var routes = require('./routes/index');
var users = require('./routes/users');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(cp());
app.use(bp.urlencoded({extended: false}));
app.use(bp.json());
app.use(express.static(path.join(__dirname, 'public')));

//Express session initialization
app.use(session({
  secret: 'loverlybunchococonuts',
  saveUninitialized: true,
  resave: true
}));


app.use(pp.initialize());
app.use(pp.session());

//express validator

app.use(ev({
  errorFormatter: (para, msg, val) => {
    var ns = para.split('.'), root = ns.shift(), formPara = root;

    while(ns.length){
      formPara += '[' + ns.shift() +']';
    }
    return{
      param: formPara,
      msg: msg,
      value: val
    }
  }
}));

//connect flash
app.use(flash());


app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.err_msg = req.flash('err_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use((req, res, next) => {
  console.dir(req);
  next();
});
app.use('/', routes);
app.use('/users', users);


// app.get('/', (req, res)=>{
//   res.sendStatus(200) ;
// });



app.listen(port, (err)=> {
  if(err){
    logman.error(err);
  }
  logman.info(`Listening for requests on port: ${port}`);
});
