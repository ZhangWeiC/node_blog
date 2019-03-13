var express = require('express');
var mysql = require('../database');
var crypto = require('crypto');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var page = req.query.page || 1;
  var start = (page-1)*8;
  var end = page * 8;
  var queryCount = 'SELECT COUNT(*) AS articleNum FROM article'
  var queryArticle = 'SELECT * FROM article ORDER BY articleID DESC LIMIT ' + start + ',' + end;
  mysql.query(queryArticle, function (err, rows, fields) {
    var articles = rows;
    articles.forEach(function (item) {
      var year = item.articleTime.getFullYear();
      var month = item.articleTime.getMonth()+1>10 ? item.articleTime.getMonth() : '0'+(item.articleTime.getMonth()+1);
      var date = item.articleTime.getDate()>10 ? item.articleTime.getDate() : '0'+item.articleTime.getDate();
      item.articleTime = year+'-'+month+'-'+date; 
    });
    mysql.query(queryCount, function(err, rows, fields){
      var articleNum = rows[0].articleNum;
      var pageNum = Math.ceil(articleNum/8);
      res.render('index', {
        articles: articles,
        user: req.session.user,
        page: page,
        pageNum: pageNum
      });
    });
  });
});

/* GET login page. */
router.get('/login', function(req, res, next){
  res.render('login', { message: '' });
});

router.post('/login', function(req, res, next){
  var name = req.body.name;
  var psw = req.body.password;
  var hash = crypto.createHash('md5');
  hash.update(psw);
  password = hash.digest('hex');
  var query = 'SELECT * FROM author WHERE authorName=' + mysql.escape(name) + 'AND authorPassword=' + mysql.escape(password);
  mysql.query(query, function(err, rows, fields){
    if(err){
      console.log(err);
      return;
    }
    var user = rows[0];
    console.log(user);
    
    if(!user){
      res.render('login', {message:'用户名或密码错误'});
      return;
    }

    req.session.user = user;
    // req.session.userSign = true;
    // req.session.userID = user.authorID;
    res.redirect('/');
  });
})

/* GET article page */
router.get('/articles/:articleID', function(req, res, next){
  var articleID = req.params.articleID;
  var query = 'SELECT * FROM article WHERE articleID = ' + mysql.escape(articleID);
  mysql.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return;
    }
    var article = rows[0];
    
    var query_1 = 'UPDATE article SET articleClick = articleClick+1 WHERE articleID='+mysql.escape(articleID);
    mysql.query(query_1, function(err, rows, fields){
      if(err){
        console.log(err);
        return;
      }
      var year = article.articleTime.getFullYear();
      var month = article.articleTime.getMonth() + 1 > 10 ? article.articleTime.getMonth() : '0' + (article.articleTime.getMonth() + 1);
      var date = article.articleTime.getDate() > 10 ? article.articleTime.getDate() : '0' + article.articleTime.getDate();
      article.articleTime = year + '-' + month + '-' + date;
      res.render('article', {
        article: article,
        user: req.session.user
      });
    });
  });
});

/* 登陆通过session验证 */
router.post('/edit', function(req, res, next){
  var title = req.body.title;
  var content = req.body.content;
  var author = req.session.user.authorName;
  var query = 'INSERT article SET articleTitle=' +mysql.escape(title)+ ', articleAuthor=' 
  + mysql.escape(author) + ', articleContent='+ mysql.escape(content) + ', articleTime=CURDATE()';
  mysql.query(query, function(err, rows, fields){
    if (err) {
      console.log(err);
      return;
    }

    res.redirect('/');
  }); 
});

/* GET edit page */
router.get('/edit', function(req, res, next){
  var user = req.session.user;
  if (!user) {
    res.redirect('/');
  }
  res.render('edit', {user: req.session.user});
});

/* GET frends page */
router.get('/friends', function(req, res, next){
  res.render('friends', {user: req.session.user});
});

/* GET about page */
router.get('/about', function(req, res, next){
  res.render('about', {user: req.session.user});
});

/* GET logout page */
router.get('/logout', function(req, res, next){
  req.session.user = null;
  res.redirect('/');
});

/* GET modify page */
router.get('/modify/:articleID', function(req, res, next){
  var articleID = req.params.articleID;
  var user = req.session.user;
  var query = 'SELECT * FROM article WHERE articleID = ' + mysql.escape(articleID);
  if(!user){
    res.redirect('/login');
    return;
  }
  mysql.query(query, function(err, rows, fields){
    if(err){
      console.log(err);
      return;
    }

    var article = rows[0];
    var title = article.articleTitle;
    var content = article.articleContent;

    res.render('modify', {user: user, title: title, content: content});
  });
});

router.post('/modify/:articleID', function(req, res, next){
  var articleID = req.params.articleID;
  // var user = req.session.user;
  var title = req.body.title;
  var content = req.body.content;
  var query = "UPDATE article SET articleTitle=" +mysql.escape(title)+ ",articleContent=" 
  +mysql.escape(content) + "WHERE articleID = " + articleID;

  mysql.query(query, function(err, rows, fields){
    if(err){
      console.log(err);
      return;
    }
    res.redirect('/');
  });
});

/* GET delete page */
router.get('/delete/:articleID', function(req, res, next){
  var articleID = req.params.articleID;
  var user = req.session.user;
  var query = 'DELETE FROM article WHERE articleID='+ mysql.escape(articleID);
  if(!user){
    res.redirect('/login');
    return;
  }
  mysql.query(query, function (err, rows, fields) { 
    if (err) {
      console.log(err);
      return;
    }
    res.redirect('/');
   });
});

module.exports = router;
