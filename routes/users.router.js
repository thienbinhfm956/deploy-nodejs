var express = require("express");
var bcrypt = require("bcrypt");
var moment = require("moment");
var passport = require("passport");
var userModel = require("../models/user.model");
var postModel = require("../models/post.model");
var restricted = require("../middlewares/restricted.mdw");
var db=require("../utils/db");
var router = express.Router();
var premium = require("../middlewares/premium.mdw")

router.get("/register", (req, res, next) => {
  res.render("view_users/register", {
    layout: false
  });
});

router.post("/register", (req, res, next) => {
  var saltRounds = 12;
  var hash = bcrypt.hashSync(req.body.t_password, saltRounds);
  var dob = moment(req.body.dob, "DD/MM/YYYY").format("YYYY-MM-DD");

  // console.log(hash);
  // console.log(dob);

  var entity = req.body;
  entity.password = hash;
  entity.date_of_birth = dob;
  // entity.id_permission = 0;
  // console.log(entity);
  delete entity.t_password;
  delete entity.confirm;
  delete entity.dob;

  // console.log(Date.now());

  var dateNow = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

  var dnow = new Date();
  dnow.setDate(dnow.getDate() + 7);
  console.log(dnow);
  var expirationDate = moment(dnow).format("YYYY-MM-DD HH:mm:ss");
  // console.log(expirationDate);

  var insertData = {
    username: entity.username,
    password: entity.password,
    displayname: entity.displayname,
    created_date: dateNow,
    email: entity.email,
    date_of_birth: dob
  };

  // console.log(insertData);

  //insert new user
  userModel
    .add(insertData)
    .then(idUser => {
      // console.log("idUser" + idUser);
      var Subscriber = {
        id_user: idUser,
        expiration_date: expirationDate
      };
      // console.log(Subscriber);
      //insert new Subscriber
      userModel
        .addSubscriber(Subscriber)
        .then(idUser => {
          console.log(Subscriber);
          res.redirect("/users/login");
        })
        .catch(next);
    })
    .catch(next);
  // res.end("post");
  // res.redirect("/users/register");
});

router.get("/is-available", (req, res, next) => {
  var user = req.query.user;
  userModel.singleByUserName(user).then(rows => {
    if (rows.length > 0) res.json(false);
    else res.json(true);
  });
});

router.get("/login", (req, res, next) => {
  res.render("view_users/login", {
    layout: false
  });
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render("view_users/login", {
        layout: false,
        err_message: "Invalid username or password"
        // err_message: info.message
      });
    }
    var retUrl = req.query.retUrl || "/";
    req.logIn(user, err => {
      if (err) {
        return next(err);
      }
      return res.redirect(retUrl);
    });
  })(req, res, next);
});

router.post("/logout", restricted, (req, res, next) => {
  req.logout();
  res.redirect("/");
});

router.get("/profile", restricted, (req, res, next) => {
  if (res.locals.isAuthenticated) {
    var _pseudonym ='';
    if(res.locals.is_writer)
    {
       _pseudonym = res.locals.writer_mdw[0]["pseudonym"];
    }
    userModel
      .single(req.user.id)
      .then(rows => {
        res.render("view_users/edit-profile", {
          info: rows[0],
          pseudonym: _pseudonym
        });
      })
      .catch(next);
    }else
    {
      res.render("404", {
        layout: false
      });
    }
});

router.post("/profile", restricted, (req, res, next) => {
  if (res.locals.isAuthenticated) {
    var entity ={
      id: req.user.id,
      username: req.body.username,
      displayname:req.body.displayname,
      email:req.body.email
    };
   
    var retUrl = req.query.retUrl || "/";
    userModel.update(entity)
    .then(id=>{
      res.redirect(retUrl);
    })
    .catch(next);
  }else
  {
    res.render("404", {
      layout: false
    });
  }
});


router.post("/changes_password", restricted, (req, res, next) => {
  if (res.locals.isAuthenticated) {
    var saltRounds = 12;
    var check = bcrypt.compareSync(req.body.old_pass, req.user.password)   // true
    var newPass=bcrypt.hashSync(req.body.new_pass, saltRounds);
    console.log("check=>"+check);
    var entity = {
      id: req.user.id,
      password : newPass
    }
    if(check == true){
      userModel.update(entity)
      .then(id=>{
          res.redirect("/");
      })
      .catch(next);
    }else
    {
      res.redirect('/users/profile');
    }
  }else
  {
    res.render("404", {
      layout: false
    });
  }
});
//read single post
router.get("/read/:id/:slug_title",premium ,async (req, res, next) => {
  var id =req.params.id;
  var rows =await postModel.single(id);
  if(rows[0].is_premium == 1){
    var maxAge = 60000;
    req.session.cookie.maxAge = maxAge;
  }
  Promise.all([
    postModel.getViews(id),
    postModel.single(id),
    postModel.getComment(id),
    //5 bài viết cùng chuyên mục
    db.load(`
    select post.*, category.name as 'catname', category.slug_name as 'cat_slugname'
    from post join category on post.id_category = category.id
    where post.is_delete = 0 and post.id != '${req.params.id}' and
    post.id_category = (select post.id_category 
					          from post
                    where post.id = '${req.params.id}') `)
  ])
  .then(([temp,post,comment,sameCat]) => {
    var view = +temp[0]['views'];
    var viewEntity ={
      id : id,
      views: view + 1
    }
    postModel.update(viewEntity)
    .then(id=>{
    res.render(
      "view_posts/single-post",
      // "view_posts/single-post_publish",
      {
        post: post[0],
        // tag: req.params.tag,
        info: req.user,
        count: comment.length,
        comment: comment,
        sameCat:sameCat
      },
      
      console.log(viewEntity)
     );
    }).catch(next);
  });
});

//comment single post

router.post("/read/:id/:slug_title", (req, res, next) => {
  var entity = {
    displayname: req.body.displayname,
    comment_content: req.body.content,
    comment_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
    last_update: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
    id_post: req.params.id
  };
  
  var retUrl =req.query.retUrl ||"/users/read/"+req.params.id +"/"+req.params.slug_title;
  postModel
    .addComment(entity)
    .then(id => {
      res.redirect(retUrl);
    })
    .catch(next);
});

module.exports = router;
