var express = require("express");
var postModel = require("../models/post.model");
var categoryModel = require("../models/categories.model");
var db = require("../utils/db");
var router = express.Router();
var moment = require("moment");
var config = require("../config/default.json");
// categories cho navbar

/* #region  tempt */

// router.get("/categories", (req, res) => {
//   res.render("view_posts/categories-post", {
//     // post_subcategories: res.locals.post_categories
//   });
// });

// router.get("/category/single", (req, res) => {
//   // res.render("view_posts/single-post");
//   // res.render("view_posts/single-post_test");
//   res.render("view_posts/single-post_publish");
// });

// router.get("/category/singleArticles", (req, res) => {
//   // res.render("view_posts/single-post");
//   // res.render("view_posts/single-post_test");
//   res.render("view_posts/single-post");
// });

//single post

// router.get("/category/:id", (req, res, next) => {
//   var id = req.params.id;
//   if (isNaN(id)) {
//     res.render("error", {
//       layout: false
//     });
//     return;
//   }
//   postModel.single(id).then(rows => {
//     if (rows.length > 0) {
//       // console.log("post.router rows");
//       // console.log(rows);
//       // console.log("post.router rows[0]");
//       // console.log(rows[0]);
//       // console.log(rows[0].content);

//       res.render("view_posts/single-post_publish", {
//         error: false,
//         post_publish: rows[0]
//         // post_categories: res.locals.post_categories
//       });
//     } else {
//       res.render("error", {
//         error: true
//       });
//     }
//   });
// });
/* #endregion */

//chỗ này sẽ hiển thị chi tiết 1 bài báo
//slug_title: tên không dấu
router.get("/single/:slug_title", (req, res, next) => {
  console.log("posts/single/slug_title");
  var slug_title = req.params.slug_title;
  console.log(slug_title);

  if (!slug_title || slug_title.length === 0) {
    res.render("404", {
      layout: false
    });
    return;
  }
  Promise.all([
    db.load(
      `select post.*, 
              category.name as 'catname', category.slug_name as 'cat_slugname',
              subcategory.name as 'subname', subcategory.slug_name as 'sub_slugname'
      from post join category on post.id_category = category.id 
      join subcategory on post.id_subcategory = subcategory.id
      where post.slug_title = '${slug_title}' 
      and post.is_delete = 0 and category.is_delete = 0 and subcategory.is_delete = 0`
    ),

    // postModel.getComment(req.params.id)
    db.load(`  
    select comment.*, post.id
          from comment join post on comment.id_post = post.id
          where post.slug_title = '${slug_title}' 
          and post.is_delete = 0 and comment.is_delete = 0`),

    //5 bài viết cùng chuyên mục
    db.load(`
    select post.*, category.name as 'catname', category.slug_name as 'cat_slugname'
    from post join category on post.id_category = category.id
    where post.is_delete = 0 and
    post.id_category = (select post.id_category 
					          from post
                    where post.slug_title = '${slug_title}')
    limit 0, 5;
    `)
  ]).then(([rows, comments, sameCategories]) => {
    // console.log(rows.length);
    if (rows.length > 0) {
      res.render("view_posts/single-post_publish", {
        error: false,
        post_publish: rows[0],
        comments,
        count: comments.length,
        sameCategories,
        // post_tags: tags
        // post_categories: res.locals.post_categories
      }
      );
    } else {
      res.render("404", {
        // error: true
        layout: false
      });
    }
  });
});

// comment single post

router.post("/single/:slug_title", (req, res, next) => {

  var entity = {
    displayname: req.body.displayname,
    comment_content: req.body.content,
    comment_date: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
    last_update: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
    id_post: req.body.id_post
  };

  var retUrl =
    req.query.retUrl ||
    "/posts/single/" + req.params.slug_title;
  postModel
    .addComment(entity)
    .then(id => {
      res.redirect(retUrl);
    })
    .catch(next);
});

//chỗ này sẽ hiển thị các bài báo sau khi nhấn vào category
//slug: tên không dấu
router.get("/menu/:slug_title", (req, res, next) => {
  console.log("posts/meunu/slug-title");
  var slug_title = req.params.slug_title;
  console.log(slug_title);

  if (!slug_title || slug_title.length === 0) {
    res.render("404", {
      layout: false
    });
    return;
  }

  //dành cho phân trang
  var limit = config.paginate.default;
  //var limit = 5;
  var page = req.query.page || 1;
  if (page < 1) {
    page = 1;
  }
  var start_offset = (page - 1) * limit;

  //console.log(start_offset);

  Promise.all([
    //chỉ để đếm total
    db.load(
      `select count(*) as totalPages
      from post join category on post.id_category = category.id
      where post.status = 2 and
      category.slug_name = '${slug_title}' and category.is_delete = 0 and post.is_delete = 0`
    ),
    //phân trang
    db.load(
      `select post.* ,
            category.name as 'catname', category.slug_name as 'cat_slugname'
      from post join category on post.id_category = category.id
      where post.status = 2 and
      category.slug_name = '${slug_title}' and category.is_delete = 0 and post.is_delete = 0
      limit ${limit} offset ${start_offset}`
    ),
    //tags
    db.load(
      `select post_tag.*, tag.name as 'tagname'
        from post_tag join tag on post_tag.id_tag = tag.id`
    )
  ])
    .then(([postsTotal, posts, post_tags]) => {
      if (posts.length > 0) {
        console.log(postsTotal[0].totalPages);
        console.log(post_tags.length);
        console.log(posts.length);

        var total = postsTotal[0].totalPages;
        var nPages = Math.floor(total / limit);
        if (total % limit > 0) {
          nPages++;
        }

        var page_numbers = [];
        for (i = 1; i <= nPages; i++) {
          page_numbers.push({
            value: i,
            active: i === +page
          });
        }

        res.render("view_posts/group-post", {
          error: false,
          post_publish: posts,
          post_tags: post_tags,
          page_numbers
        });
      } //
      else {
        res.render("404", {
          // error: true
          layout: false
        });
      }
    })
    .catch(next);

  //res.render("home");
});

//chỗ này sẽ hiển thị các bài báo sau khi nhấn vào category/subcategory
//slug: tên không dấu
router.get("/menu/:slug_cat/:slug_sub", (req, res, next) => {
  console.log("posts/meunu/slug-cat/slug-sub");
  var slug_cat = req.params.slug_cat;
  var slug_sub = req.params.slug_sub;
  console.log(req.params);
  console.log(slug_cat);
  console.log(slug_sub);

  if (
    !slug_cat ||
    slug_cat.length === 0 ||
    (!slug_sub || slug_sub.length === 0)
  ) {
    res.render("404", {
      layout: false
    });
    return;
  }

  //dành cho phân trang
  var limit = config.paginate.default;
  //var limit = 5;
  var page = req.query.page || 1;
  if (page < 1) {
    page = 1;
  }
  var start_offset = (page - 1) * limit;

  //console.log(start_offset);
  Promise.all([
    //chỉ để đếm total
    db.load(
      `select count(*) as totalPages
      from post join category on post.id_category = category.id
      join subcategory on  post.id_subcategory = subcategory.id  
      where category.slug_name = '${slug_cat}' and subcategory.slug_name = '${slug_sub}'
      and post.status = 2 and
      category.is_delete = 0 and post.is_delete = 0 and subcategory.is_delete = 0`
    ),

    //phân trang
    db.load(
      `select post.*,  
		        category.name as 'catname', category.slug_name as 'cat_slugname',
            subcategory.name as 'subname', subcategory.slug_name as 'sub_slugname' 
      from post join category on post.id_category = category.id
      join subcategory on  post.id_subcategory = subcategory.id  
      where category.slug_name = '${slug_cat}' and subcategory.slug_name = '${slug_sub}'
      and post.status = 2 and
      category.is_delete = 0 and post.is_delete = 0 and subcategory.is_delete = 0
      limit ${limit} offset ${start_offset}`
    ),
    //tags
    db.load(
      `select post_tag.*, tag.name as 'tagname'
        from post_tag join tag on post_tag.id_tag = tag.id`
    )
  ])
    .then(([postsTotal, posts, post_tags]) => {
      if (posts.length > 0) {
        console.log(postsTotal[0].totalPages);
        console.log(post_tags.length);
        console.log(posts.length);

        var total = postsTotal[0].totalPages;
        var nPages = Math.floor(total / limit);
        if (total % limit > 0) {
          nPages++;
        }

        var page_numbers = [];
        for (i = 1; i <= nPages; i++) {
          page_numbers.push({
            value: i,
            active: i === +page
          });
        }

        res.render("view_posts/group-post", {
          error: false,
          is_have_subcategory: true,
          post_publish: posts,
          post_tags: post_tags,
          page_numbers
        });
      } //
      else {
        res.render("404", {
          // error: true
          layout: false
        });
      }
    })
    .catch(next);

  //res.render("home");
});

//chỗ này sẽ hiển thị các bài báo sau khi nhấn vào category hoặc subcategory
//tagname: tên tên tag
router.get("/tag/:tagname", (req, res, next) => {
  console.log("posts/tag/tagname");
  var tagname = req.params.tagname;
  console.log(tagname);

  if (!tagname || tagname.length === 0) {
    res.render("404", {
      layout: false
    });
    return;
  }

  //dành cho phân trang
  var limit = config.paginate.default;
  //var limit = 5;
  var page = req.query.page || 1;
  if (page < 1) {
    page = 1;
  }
  var start_offset = (page - 1) * limit;

  Promise.all([
    //chỉ để đếm total
    db.load(
      `select count(*) as totalPages
      from post join post_tag on post.id = post_tag.id_post
          join tag on tag.id = post_tag.id_tag
      where tag.name = '${tagname}' and
      post.status = 2 and post.is_delete = 0 and tag.is_delete = 0`
    ),
    //phân trang
    db.load(
      `select post.*, tag.name as 'tagname', tag.id as 'tagid'
      from post join post_tag on post.id = post_tag.id_post
          join tag on tag.id = post_tag.id_tag
      where  tag.name = '${tagname}' and
      post.status = 2 and post.is_delete = 0 and tag.is_delete = 0
      limit ${limit} offset ${start_offset}`
    ),
    //tags
    db.load(
      `select post_tag.*, tag.name as 'tagname'
        from post_tag join tag on post_tag.id_tag = tag.id`
    )
  ])
    .then(([postsTotal, posts, post_tags]) => {
      if (posts.length > 0) {
        console.log(postsTotal[0].totalPages);
        console.log(post_tags.length);
        console.log(posts.length);

        var total = postsTotal[0].totalPages;
        var nPages = Math.floor(total / limit);
        if (total % limit > 0) {
          nPages++;
        }

        var page_numbers = [];
        for (i = 1; i <= nPages; i++) {
          page_numbers.push({
            value: i,
            active: i === +page
          });
        }

        res.render("view_posts/tag-post", {
          error: false,
          post_publish: posts,
          post_tags: post_tags,
          page_numbers
        });
      } //
      else {
        res.render("404", {
          // error: true
          layout: false
        });
      }
    })
    .catch(next);

  //res.render("home");
});

//chỗ này sẽ hiển thị các bài báo sau khi search
//keyword: từ khoá tìm kiếm
router.get("/search", (req, res, next) => {
  var keyword = req.query.keyword;
  console.log("keyword: " + keyword);

  if (!keyword || keyword.length === 0) {
    res.redirect("/");
  }
  //dành cho phân trang
  var limit = config.paginate.default;
  //var limit = 5;
  var page = req.query.page || 1;
  if (page < 1) {
    page = 1;
  }
  var start_offset = (page - 1) * limit;
  console.log(page);
  Promise.all([
    //chỉ để đếm total
    db.load(`
    select count(*) as totalPages
    from post join  category on post.id_category = category.id 
              join subcategory on  post.id_subcategory = subcategory.id  
    where 
    (
       MATCH (post.title, post.summary, post.content, post.slug_title) AGAINST ('${keyword}')
    OR MATCH (category.name, category.slug_name) AGAINST ('${keyword}')
    OR MATCH (subcategory.name, subcategory.slug_name) AGAINST ('${keyword}')
    )  
    and post.status = 2 and post.is_delete = 0 `),
    //phân trang
    db.load(`
    select post.*, 
		        category.name as 'catname', category.slug_name as 'cat_slugname',
	          subcategory.name as 'subname', subcategory.slug_name as 'sub_slugname' 
    from post join  category on post.id_category = category.id 
              join subcategory on  post.id_subcategory = subcategory.id  
    where 
    (
       MATCH (post.title, post.summary, post.content, post.slug_title) AGAINST ('${keyword}' IN NATURAL LANGUAGE MODE)
    OR MATCH (category.name, category.slug_name) AGAINST ('${keyword}' IN NATURAL LANGUAGE MODE)
    OR MATCH (subcategory.name, subcategory.slug_name) AGAINST ('${keyword}'IN NATURAL LANGUAGE MODE)
    )  
    and post.status = 2 and post.is_delete = 0
    limit ${limit} offset ${start_offset}`),  

    //tags
    db.load(
      `select post_tag.*, tag.name as 'tagname'
        from post_tag join tag on post_tag.id_tag = tag.id`
    )
  ])
    .then(([postsTotal, posts, post_tags]) => {
      console.log(postsTotal[0].totalPages);
      console.log(post_tags.length);
      console.log(posts.length);

      var total = postsTotal[0].totalPages;
      var nPages = Math.floor(total / limit);
      if (total % limit > 0) {
        nPages++;
      }

      var page_numbers = [];
      for (i = 1; i <= nPages; i++) {
        page_numbers.push({
          value: i,
          active: i === +page,
          keyword
        });
      }

      res.render("view_posts/search-post", {
        error: false,
        post_publish: posts,
        post_tags: post_tags,
        page_numbers
      });
    })
    .catch(next);

  //res.end("search:" + keyword);

  //res.render("home");
});

module.exports = router;
