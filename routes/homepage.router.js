var express = require("express");
var userModel = require("../models/user.model");
var categoryModel = require("../models/categories.model");
var postsModel = require("../models/post.model");
var db = require("../utils/db");
var router = express.Router();

router.get("/", (req, res, next) => {
  Promise.all([
    //do giao diện ko đồng nhất nên load tuần tự 3 view cao nhất
    //load 1st view
    db.load(`select post.*, 
                      category.name as 'catname', category.slug_name as 'cat_slugname'
              from post join category on post.id_category = category.id 
              where post.status = 2 and post.is_delete = 0 and category.is_delete = 0
              order by post.views desc, post.post_date desc limit 0,1`),
    //load 2nd view
    db.load(`select post.*, 
                      category.name as 'catname', category.slug_name as 'cat_slugname'
              from post join category on post.id_category = category.id 
              where post.status = 2 and post.is_delete = 0 and category.is_delete = 0
              order by post.views desc, post.post_date desc limit 1,1`),
    //load 3rd view
    db.load(`select post.*, 
                      category.name as 'catname', category.slug_name as 'cat_slugname'
              from post join category on post.id_category = category.id 
              where post.status = 2 and post.is_delete = 0 and category.is_delete = 0
              order by post.views desc, post.post_date desc limit 2,1`),

    //Hiển thị 10 bài viết được xem nhiều nhất (mọi chuyên mục)
    db.load(`select post.*, 
                    category.name as 'catname', category.slug_name as 'cat_slugname'
             from post join category on post.id_category = category.id 
             where post.status = 2 and post.is_delete = 0 and category.is_delete = 0
             order by post.views desc, post.post_date desc limit 0,9`),

    //Hiển thị 10 bài viết mới nhất (mọi chuyên mục)
    db.load(`select post.*, 
                    category.name as 'catname', category.slug_name as 'cat_slugname'
             from post join category on post.id_category = category.id 
             where post.status = 2 and post.is_delete = 0 and category.is_delete = 0
             order by post.post_date desc, post.title asc limit 0,9`),

    //Hiển thị top 10 chuyên mục, mỗi chuyên mục 1 bài mới nhất
    //database đang có 4 chuyên mục
    db.load(`select post.*,
                    category.name as 'catname', category.slug_name as 'cat_slugname'
             from post join category on post.id_category = category.id           
             where post.id_category in (select id from category where category.is_delete = 0) 
             and post.post_date = (select max(post_date) 
                           from post p where p.id_category = post.id_category
                           and p.status = 2 and p.is_delete = 0)
             and post.status = 2 and post.is_delete = 0 and category.is_delete = 0`),

    //tags
    db.load(
      `select post_tag.*, tag.name as 'tagname'
          from post_tag join tag on post_tag.id_tag = tag.id`
    )
  ])

    .then(
      ([
        view_1st,
        view_2nd,
        view_3rd,
        most_views,
        new_posts,
        newPost_ByCategory,
        tags
      ]) => {
        res.render("view_posts/home", {
          view_1st,
          view_2nd,
          view_3rd,
          most_views,
          new_posts,
          newPost_ByCategory,
          post_tags: tags
        });
      }
    )
    .catch(next);
});

module.exports = router;
