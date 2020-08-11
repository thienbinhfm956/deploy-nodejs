var express = require("express");
var userModel = require("../models/user.model");
var categoryModel = require("../models/categories.model");
var postsModel = require("../models/post.model");
var db = require("../utils/db");
var router = express.Router();

router.get("/", (req, res) => {
  //phải đăng nhập và là admin thì mới được vào trang admin
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    // res.end("sb admin");
    res.render("view_managers/index", {
      layout: "sbadmin_layout"
    });
  } else {
    res.render("404", {
      layout: false
    });
  }
});

/* #region CATEGORIES */

router.get("/categories", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    // res.end("managers/categories");
    categoryModel
      .all()
      .then(rows => {
        res.render("view_managers/vm_categories/m_categories", {
          layout: "sbadmin_layout",
          categories: rows
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/categories/delete/:id", (req, res, next) => {
  var CatID = +req.params.id;
  var retUrl = req.query.retUrl || "/managers/categories";
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .delete(CatID)
      .then(res.redirect(retUrl))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/categories/edit/:id", (req, res, next) => {
  var CatID = req.params.id;
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .singleBy("category", "id", CatID)
      .then(rows => {
        console.log(rows);
        res.render("view_managers/vm_categories/edit_category", {
          layout: "sbadmin_layout",
          category: rows[0],
          id: CatID
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});


router.post("/categories/edit/:id", (req, res, next) => {
  var entity = {
    id : +req.params.id,
    name: req.body.cat_name,
    slug_name: req.body.slug_name,
    is_delete: +req.body.is_delete
  };
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .update(entity)
      .then(res.redirect("/managers/categories"))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/category/add", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.render("view_managers/vm_categories/m_category_add", {
      layout: "sbadmin_layout"
    });
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.post("/category/add", (req, res, next) => {
  console.log("post/category/add");
  console.log(req.body);

  var entity = {
    name: req.body.catname,
    slug_name: req.body.slug_name
  };

  console.log(entity);

  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .add(entity)
      .then(id => {
        res.render("view_managers/vm_categories/m_category_add", {
          layout: "sbadmin_layout",
          is_sesuccessful: true
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("view_managers/vm_categories/m_category_add", {
  //   layout: "sbadmin_layout"
  // });
});

router.get("/category/name-is-available", (req, res, next) => {
  var name = req.query.exist_name;
  console.log("category/name-is-available");
  console.log(name);
  categoryModel.singleByIs("category", "name", name, 0).then(rows => {
    if (rows.length > 0) {
      console.log("false");
      res.json(false);
    } else {
      console.log("true");
      res.json(true);
    }
  });
});

router.get("/category/slug_name-is-available", (req, res, next) => {
  var slug_name = req.query.exist_slug_name;
  console.log("category/slug_name-is-available");
  console.log(slug_name);
  categoryModel.singleByIs("category", "slug_name", slug_name, 0).then(rows => {
    if (rows.length > 0) {
      console.log("false");
      res.json(false);
    } else {
      console.log("true");
      res.json(true);
    }
  });
});

/* #endregion */

/* #region SUBCATEGORIES */

router.get("/subcategories1", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    // res.end("managers/subcategories1");

    categoryModel
      .allSubCategory_Dependent_Cat()
      .then(rows => {
        res.render("view_managers/vm_categories/m_subcategories1", {
          layout: "sbadmin_layout",
          subcategories1: rows
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

router.get("/subcategory1/add", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .all()
      .then(rows => {
        res.render("view_managers/vm_categories/m_subcategory1_add", {
          layout: "sbadmin_layout",
          categories: rows
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.post("/subcategory1/add", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    var entity = {
      table: "subcategory",
      name: req.body.subname,
      slug_name: req.body.slug_name,
      id_category: +req.body.chooseCat
    };
    console.log(entity);

    // kiểm tra tồn tại (kiểm tra lần cuối trước khi thêm để tránh trùng, dù giao diện đã kiểm tra)
    db.loadByExist("subcategory", "name", entity.name, 0)
      .then(rows => {
        //nếu đã tồn tại
        if (rows.length > 0) {
            console.log("subcategory/add: " + entity.name + " đã tồn tại");
          res.render("view_managers/vm_categories/m_subcategory1_add", {
            layout: "sbadmin_layout",
            //is_sesuccessful: true,
            //is_sesuccessful_name: entity.name
          });
        }
        //nếu chưa tồn tại
        else {
          if (entity.id_category >= 0) {
            categoryModel
              .add_Table(entity)
              .then(id => {
                res.render("view_managers/vm_categories/m_subcategory1_add", {
                  layout: "sbadmin_layout",
                  categories: res.locals.post_categories_mdw,
                  is_sesuccessful: true,
                  is_sesuccessful_name: entity.name
                });
              })
              .catch(next);
          } //
          else {
            res.render("view_managers/vm_categories/m_subcategory1_add", {
              layout: "sbadmin_layout",
              categories: res.locals.post_categories_mdw,
              is_failure: true
            });
          }
        }
      })
      .catch(next);
  } //
  else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/subcategory1/edit/:id",async (req, res, next) => {
  var SubID = +req.params.id;
  var categories =await categoryModel.all();
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .singleBy("subcategory", "id", SubID)
      .then(rows => {
        for (const c of categories) {
          if(rows[0].id_category === c.id){
            c.isSelected = true;
          }
        }
        res.render("view_managers/vm_categories/edit_subcategory", {
          layout: "sbadmin_layout",
          categories: categories,
          id: SubID,
          subCategory : rows[0]
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});


router.post("/subcategory1/edit/:id",async (req, res, next) => {
  var entity = {
    id : +req.params.id,
    table: "subcategory",
    name: req.body.subname,
    slug_name: req.body.slug_name,
    id_category: +req.body.chooseCat,
    is_delete: +req.body.is_delete
  };
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .update_Table(entity)
      .then(res.redirect("/managers/subcategories1"))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/subcategory1/delete/:id", (req, res, next) => {
  var subID = +req.params.id;
  var table = 'subcategory'
  var retUrl = req.query.retUrl || "/managers/subcategories1";
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    categoryModel
      .deletesub(subID,table)
      .then(res.redirect(retUrl))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/subcategory1/subname-is-available", (req, res, next) => {
  var subname = req.query.exist_subname;
  categoryModel.singleBy("subcategory", "name", subname).then(rows => {
    if (rows.length > 0) {
      res.json(false);
    } else {
      res.json(true);
    }
  });
});

router.get("/subcategory1/slug_name-is-available", (req, res, next) => {
  var slug_name = req.query.exist_slug_name;
  categoryModel.singleBy("subcategory", "slug_name", slug_name).then(rows => {
    if (rows.length > 0) {
      console.log("false");
      res.json(false);
    } else {
      console.log("true");
      res.json(true);
    }
  });
});
/* #endregion */

/* #region USERS */

router.get("/user_permission", (req, res) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.end("managers/user_permission");
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

router.get("/users", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    userModel
      .allForView()
      .then(rows => {
        res.render("view_managers/vm_users/m_user", {
          layout: "sbadmin_layout",
          users: rows
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
  // res.end("managers/users")
});

router.get("/users/edit/:id",async (req, res, next) => {
  var UserID = +req.params.id;
  var permission =await userModel.allpermission();
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    userModel
      .single( UserID)
      .then(rows => {
        for (const c of permission) {
          if(rows[0].id_permission === c.id){
            c.isSelected = true;
          }
        }
        res.render("view_managers/vm_users/edit_user", {
          layout: "sbadmin_layout",
          user: rows[0],
          permission: permission
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.post("/users/edit/:id",async (req, res, next) => {
  var entity = {
    id : +req.params.id,
    id_permission: req.body.permission,
    is_delete : req.body.is_delete
  };
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    userModel
      .update(entity)
      .then(res.redirect("/managers/users"))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/users/delete/:id", (req, res, next) => {
  var UserID = +req.params.id;
  var retUrl = req.query.retUrl || "/managers/users";
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    userModel
      .remove(UserID)
      .then(res.redirect(retUrl))
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }
});


/* #endregion */

/* #region POSTS */

router.get("/posts", (req, res) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.end("managers/posts");
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

router.get("/comments", (req, res) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.end("managers/comments");
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

router.get("/post_images", (req, res) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.end("managers/post_images");
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

/* #endregion */

/* #region TAGS */

router.get("/tags", (req, res, next) => {
  console.log("managers/tags");
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    postsModel
      .allTags()
      .then(rows => {
        console.log(rows);
        res.render("view_managers/vm_posts/m_tags", {
          layout: "sbadmin_layout",
          tags: rows
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

router.get("/tag/add", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.render("view_managers/vm_posts/m_tags_add", {
      layout: "sbadmin_layout"
    });
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/tag/name-is-available", (req, res, next) => {
  var name = req.query.exist_name;
  console.log("tag/name-is-available: " + name);
  // console.log(name);
  db.loadByExist("tag", "name", name, 0).then(rows => {
    if (rows.length > 0) {
      console.log("tag/name-is-available: false");
      res.json(false);
    } else {
      console.log("tag/name-is-available: true");
      res.json(true);
    }
  });
});

router.get("/tag/slug_name-is-available", (req, res, next) => {
  var slug_name = req.query.exist_slug_name;
  console.log("tag/slug_name-is-available");
  console.log(slug_name);
  db.loadByExist("tag", "slug_name", slug_name, 0).then(rows => {
    if (rows.length > 0) {
      console.log("false");
      res.json(false);
    } else {
      console.log("true");
      res.json(true);
    }
  });
});

router.post("/tag/add", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    console.log("post/tag/add");
    console.log(req.body);

    var entity = {
      name: req.body.tagname
      // slug_name: req.body.slug_name
    };

    console.log(entity);

    // kiểm tra tồn tại (kiểm tra lần cuối trước khi thêm để tránh trùng, dù giao diện đã kiểm tra)
    db.loadByExist("tag", "name", entity.name, 0)
      .then(rows => {
        console.log("tag/add loadByExist:" + rows.length);
        //nếu tồn tại
        if (rows.length > 0) {
          res.render("view_managers/vm_posts/m_tags_add", {
            layout: "sbadmin_layout",
            is_sesuccessful: false
            //is_sesuccessful_name: entity.name
          });
        }
        //nếu chưa tồn tại thì thêm
        else {
          db.add("tag", entity)
            .then(id => {
              console.log(id + " - " + entity.name);
              res.render("view_managers/vm_posts/m_tags_add", {
                layout: "sbadmin_layout",
                is_sesuccessful: true,
                is_sesuccessful_name: entity.name
              });
            })
            .catch(next);
        }
      })
      .catch(next);
  }
  //render view 404
  else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/tag/edit/:id", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    var ID = req.params.id;
    db.loadBy("tag", "id", ID)
      .then(rows => {
        console.log(rows);
        res.render("view_managers/vm_posts/m_tags_edit", {
          layout: "sbadmin_layout",
          tag: rows[0],
          id: ID
        });
      })
      .catch(next);
  }
  //render view 404
  else {
    res.render("404", {
      layout: false
    });
  }
});

router.post("/tag/edit/:id", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    var id = req.body.id;
    if (isNaN(id)) {
      res.render("error", {
        layout: false
      });
      return;
    }
    var entity = {
      name: req.body.tagname
      // is_delete: +req.body.is_delete
    };

    console.log(entity);

    db.update("tag", "id", entity, +id)
      .then(res.redirect("/managers/tags"))
      .catch(next);
  }
  //render view 404
  else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/tag/remove/:id", (req, res, next) => {
  // console.log(req.body);
  var id = req.params.id;
  if (isNaN(id)) {
    res.render("error", {
      layout: false
    });
    return;
  }
  db.remove("tag", "id", +id, 1)
    .then(res.redirect("/managers/tags"))
    .catch(next);
});

router.get("/tag/restore/:id", (req, res, next) => {
  console.log("restore:" + req.params.id);
  var id = req.params.id;
  if (isNaN(id)) {
    res.render("error", {
      layout: false
    });
    return;
  }
  db.remove("tag", "id", +id, 0)
    .then(res.redirect("/managers/tags"))
    .catch(next);
});

/* #endregion */

/* #region EMPLOYEES */

router.get("/subscribers", (req, res) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.end("managers/subscribers");
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

router.get("/writers", (req, res, next) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    userModel
      .allWriters()
      .then(rows => {
        res.render("view_managers/vm_users/m_writer", {
          layout: "sbadmin_layout",
          writers: rows
        });
      })
      .catch(next);
  } else {
    res.render("404", {
      layout: false
    });
  }

  // res.render("categories-post");
});

/* #endregion */

/* #region ORTHERS */

router.get("/tables", (req, res) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.render("view_managers/vm_neat/tables", {
      layout: "sbadmin_layout"
    });
  } else {
    res.render("404", {
      layout: false
    });
  }
});

router.get("/charts", (req, res) => {
  if (res.locals.isAuthenticated && res.locals.is_admin) {
    res.render("view_managers/vm_neat/charts", {
      layout: "sbadmin_layout"
    });
  } else {
    res.render("404", {
      layout: false
    });
  }
});
/* #endregion */

module.exports = router;
