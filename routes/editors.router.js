var express = require("express");
var editorModel = require("../models/editor.model");
var categoryModel = require("../models/categories.model");
var router = express.Router();
var moment = require("moment");
var db = require("../utils/db");
var multer = require("multer");
var config = require('../config/default.json');

router.get("/", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_editor) {
    var limit = config.paginate.default;
    var page = req.query.page || 1;
    if (page < 1) page = 1;
    var start_offset = (page - 1) * limit;
    var preButton = 1;
    var nextButton = 2;
      Promise.all([
        editorModel.AllPost(start_offset),
        db.loadAll('post'),
        editorModel.countPostWithStt("2"),
        editorModel.countPostWithStt("3"),
        editorModel.countPostWithStt("4")
      ])
      .then(([rows,nrows, countPosted,countCancel,countAppro]) => {
        var total = nrows.length;
        var nPages = Math.floor(total / limit);
        if (total % limit > 0)
          nPages++;

        var arr = new Array();
        for(var i=1 ;i <=nPages;i++)
        {
          arr.push({
            value: i,
            active: i === +page
          });
        }
        if(page <= 1)
          preButton = 0;
        else
          preButton = +page - 1;

        if(page < nPages )
          nextButton = +page + 1;
        else
          nextButton = 0;

        res.render("view_editors/index", {
          layout: "writer_layout",
          post: rows,
          count: total,
          page_numbers:arr,
          preButton,
          nextButton,
          currentPage: page,
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

router.get("/approval/:id", (req, res, next) => {
  var retUrl = req.query.retUrl || "/editors";
  if (res.locals.isAuthenticated && res.locals.is_editor) {
    var entity = {
      id : req.params.id,
      status : 1
    };
    editorModel.ApprovalPost(entity)
    .then(id=>{
      res.redirect(retUrl);
    })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/post/:id", (req, res, next) => {
  var retUrl = req.query.retUrl || "/editors";
  if (res.locals.isAuthenticated && res.locals.is_editor) {
    var entity = {
      id : req.params.id,
      status : 2
    };
    editorModel.ApprovalPost(entity)
    .then(id=>{
      res.redirect(retUrl);
    })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/cancel/:id", (req, res, next) => {
  var retUrl = req.query.retUrl || "/editors";
  if (res.locals.isAuthenticated && res.locals.is_editor) {
    var entity = {
      id : req.params.id,
      status : 3
    };
    editorModel.ApprovalPost(entity)
    .then(id=>{
      res.redirect(retUrl);
    })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/status/:status", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_editor) {
    var limit = config.paginate.default;
    var page = req.query.page || 1;
    if (page < 1) page = 1;
    var start_offset = (page - 1) * limit;
    var preButton = 1;
    var nextButton = 2;
    Promise.all([
      editorModel.pageByStt(start_offset,req.params.status),
        db.loadAll('post'),
        editorModel.countPostWithStt("2"),
        editorModel.countPostWithStt("3"),
        editorModel.countPostWithStt("4")
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

        res.render("view_editors/singleView", {
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
// router.get("/delete/:id", (req, res, next) => {
//   var retUrl = req.query.retUrl || "/editors";
//   if (res.locals.isAuthenticated && res.locals.is_editor) {
//     db.is_delete('post','id',req.params.id,1)
//       .then(res.redirect(retUrl))
//       .catch(next);
//   } else {
//     res.render("404", {
//       layout: false
//     });
//   }
// });

// router.get("/backup/:id", (req, res, next) => {
//   var retUrl = req.query.retUrl || "/editors";
//   if (res.locals.isAuthenticated && res.locals.is_editor) {
//     db.is_delete('post','id',req.params.id,0)
//       .then(res.redirect(retUrl))
//       .catch(next);
//   } else {
//     res.render("404", {
//       layout: false
//     });
//   }
// });


module.exports = router;
