var express = require("express");
var postModel = require("../models/post.model");
var categoryModel = require("../models/categories.model");
var router = express.Router();
var moment = require("moment");
var db = require("../utils/db");
var multer = require("multer");
var config = require("../config/default.json");

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./public/img/uploads");
  },

  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

var upload = multer({
  storage: storage
});

router.get("/", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    var limit = config.paginate.default;
    var page = req.query.page || 1;
    if (page < 1) page = 1;
    var start_offset = (page - 1) * limit;
    var preButton = 1;
    var nextButton = 2;
    Promise.all([
      postModel.pageById(req.user.id, start_offset),
      postModel.singleBy("id_user", req.user.id),
      postModel.countPostWithStt("status", "2", req.user.id),
      postModel.countPostWithStt("status", "3", req.user.id),
      postModel.countPostWithStt("status", "4", req.user.id)
    ])
      .then(([rows, nrows, countPosted,countCancel,countAppro]) => {
        var total = nrows.length;
        var nPages = Math.floor(total / limit);
        if (total % limit > 0) nPages++;

        var arr = new Array();
        for (var i = 1; i <= nPages; i++) {
          arr.push({
            value: i,
            active: i === +page
          });
        }

        if (page <= 1) preButton = 0;
        else preButton = +page - 1;

        if (page < nPages) nextButton = +page + 1;
        else nextButton = 0;

        res.render("view_writers/index", {
          layout: "writer_layout",
          post: rows,
          count: total,
          page_numbers: arr,
          preButton,
          nextButton,
          postedCount: countPosted[0]["count(*)"],
          cancelCount:countCancel[0]["count(*)"],
          approCount:countAppro[0]["count(*)"],
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/status/:status", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    var limit = config.paginate.default;
    var page = req.query.page || 1;
    if (page < 1) page = 1;
    var start_offset = (page - 1) * limit;
    var preButton = 1;
    var nextButton = 2;
    Promise.all([
      postModel.pageByIdAndStt(req.user.id, start_offset,req.params.status),
      postModel.singleBy("id_user", req.user.id),
      postModel.countPostWithStt("status", "2", req.user.id),
      postModel.countPostWithStt("status", "3", req.user.id),
      postModel.countPostWithStt("status", "4", req.user.id)
    ])
      .then(([rows, nrows, countPosted,countCancel,countAppro]) => {
        var total = nrows.length;
        var nPages = Math.floor(total / limit);
        if (total % limit > 0) nPages++;

        var arr = new Array();
        for (var i = 1; i <= nPages; i++) {
          arr.push({
            value: i,
            active: i === +page
          });
        }

        if (page <= 1) preButton = 0;
        else preButton = +page - 1;

        if (page < nPages) nextButton = +page + 1;
        else nextButton = 0;

        res.render("view_writers/singleView", {
          layout: "writer_layout",
          post: rows,
          count: total,
          page_numbers: arr,
          preButton,
          nextButton,
          postedCount: countPosted[0]["count(*)"],
          cancelCount:countCancel[0]["count(*)"],
          approCount:countAppro[0]["count(*)"],
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});


router.get("/published", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    var id_user = res.locals.writer_mdw[0]["id_user"];
    //console.log(id_user);
    // console.log(res.locals.countPublished_mdw[0][0]);
    // res.end("managers/categories");
    Promise.all([
      db.load(`
        select * 
        from post 
        where post.status = 2 and post.id_user = '${id_user}' and
        post.is_delete = 0
      `)
    ])
      .then(([categories]) => {
        res.render("view_writers/published", {
          layout: "writer_layout",
          categories
        });
      })
      .catch(next);
  } //
  else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/delete/:id", (req, res, next) => {
  var retUrl = req.query.retUrl || "/writers";
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    postModel
      .remove(req.params.id)
      .then(res.redirect(retUrl))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/edit/:id", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    categoryModel
      .singleBy("post", "id", req.params.id)
      .then(rows => {
        for (const c of res.locals.post_categories_mdw) {
          if(rows[0].id_category === c.id){
            c.isSelected = true;
          }
        }
        for (const c of  res.locals.post_subcategories_mdw) {
          if(rows[0].id_subcategory === c.id){
            c.isSelected = true;
          }
        }
        res.render("view_writers/edit", {
          layout: "writer_layout",
          post: rows[0],
          category: res.locals.post_categories_mdw,
          subcategories: res.locals.post_subcategories_mdw
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

//route này có thể đổi thành quyền admin or
router.get("/backup/:id", (req, res, next) => {
  var retUrl = req.query.retUrl || "/writers";
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    postModel
      .backup(req.params.id)
      .then(res.redirect(retUrl))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/writing", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    db.loadAllExist("tag", 0)
      .then(tags => {
        res.render("view_writers/writing", {
          layout: "writer_layout",
          categories: res.locals.post_categories_mdw,
          subcategories: res.locals.post_subcategories_mdw,
          tags: tags
        });
      })
      .catch(next);
  } //
  else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/writing/subcat-is-available", (req, res, next) => {
  var id_cat = req.query.id_cat;
  var id_subcat = req.query.id_subcat;

  console.log("/writing/subcat-is-available");
  console.log(id_cat + " - " + id_subcat);

  //subcategory có thể null
  if (id_subcat == 0) {
    console.log("true");
    res.json(true);
  } //
  else {
    categoryModel
      .isSubcategoryDependentCategory(id_subcat, id_cat)
      .then(rows => {
        if (rows.length <= 0) {
          console.log("false");
          res.json(false);
        } else {
          console.log("true");
          res.json(true);
        }
      });
  }
});

router.post("/writing", upload.single("fuMain"), (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_writer) {
    var TagArr = [];
    var checkedtags = req.body.tags;
    console.log(checkedtags);

    var entity = {
      title: req.body.title,
      slug_title: req.body.slug,
      post_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      last_update: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      id_user: req.body.writer_id,
      pseudonym: res.locals.writer_mdw[0]["pseudonym"],
      views: 0,
      id_category: req.body.category,
      id_subcategory: req.body.subcategory,
      content: req.body.content,
      summary: req.body.summary,
      photo: req.file.filename
    };

    console.log(entity);
    //kiểm tra id_category của subcategory có hợp lệ với category
    //vì trên giao diện chưa fix đc
    categoryModel
      .isSubcategoryDependentCategory(entity.id_subcategory, entity.id_category)
      .then(rows => {
        if (rows.length >= 0) {
          //kiểm tra slug_title để ko thêm trùng (bước kiểm tra cuối cùng)
          //tránh tình trạng vì 1 lý do nào đó ấn post nhiều lần
          //add post
          Promise.all([postModel.addPost(entity), db.loadAllExist("tag", 0)])
            .then(([insertID, tags]) => {
              // console.log("idxxx: " + insertID);
              //add vô post_tag
              for (i = 0; i < checkedtags.length; i++) {
                var en = {
                  id_post: insertID,
                  id_tag: +checkedtags[i]
                };
                // console.log(i + "- " );
                // console.log(en);
                db.add("post_tag", en)
                  .then()
                  .catch(next);
              }

              res.render("view_writers/writing", {
                layout: "writer_layout",
                categories: res.locals.post_categories_mdw,
                subcategories: res.locals.post_subcategories_mdw,
                tags: tags
              });
            })
            .catch(next);
        } //
        else {
          db.loadAllExist("tag", 0)
            .then(tags => {
              res.render("view_writers/writing", {
                layout: "writer_layout",
                categories: res.locals.post_categories_mdw,
                subcategories: res.locals.post_subcategories_mdw,
                tags: tags
              });
            })
            .catch(next);
        }
      })
      .catch(next);

    // if (req.body.category == 0) {
    //   res.redirect("/writers");
    // } else {
    //   postModel
    //     .addPost(entity)
    //     .then(id => {
    //       res.redirect("/writers");
    //     })
    //     .catch(next);
    // }
  } //
  else {
    res.render("404", {
      layout: false
    });
  }
});

router.post("/edit/:id",upload.single("fuMain"), (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_writer) {
  if (req.body.category == 0) {
    res.redirect("/writers/edit/" + res.params.id);
  } else {      
      const entity = {
        id: req.params.id,
        title: req.body.title,
        slug_title: req.body.slug,
        summary: req.body.summary,
        id_category: req.body.category,
        content: req.body.content,
        id_user: res.locals.writer_mdw[0]["id_user"],
        pseudonym: res.locals.writer_mdw[0]["pseudonym"],
        last_update: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
        id_subcategory: req.body.subcategory,
        photo: req.file.filename
      };

      postModel
        .update(entity)
        .then(id => {
          res.redirect("/writers");
        })
        .catch(next);
    }
  }else {
    res.render("404", {
      layout: false
    });
  }
});
module.exports = router;
