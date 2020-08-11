var categoryModel = require("../models/categories.model");
var url = require("url");
module.exports = (req, res, next) => {
  console.log("req.post.mdw");
  // console.log(url.parse(req.url));
  pathname = url.parse(req.url).pathname;
  var segment = pathname.split("/");
  console.log(pathname);
  console.log(segment);

  //nếu là trang chủ hoặc nếu là các trang /posts/?
  if (
    pathname == "/" ||
    segment[1] == "posts" ||
    segment[1] == "writers" ||
    segment[1] == "single" ||
    segment[1] == "search" ||
    segment[1] == "menu" ||
    segment[1] == "users" ||
    (segment[1] == "managers" && segment[2] == "subcategory1")
  ) {
    //thì load categories lên res.locals
    Promise.all([categoryModel.all(), categoryModel.allSubCategory1()])
      .then(([categories, subcategories]) => {
        res.locals.post_categories_mdw = categories;
        res.locals.post_subcategories_mdw = subcategories;
        // console.log(categories);
        // console.log(subcategories);
        next();
      })
      .catch(next);
  } else {
    console.log("!pathname");
    next();
  }
};
