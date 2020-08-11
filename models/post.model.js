var db = require("../utils/db");
var config = require("../config/default.json");
var __TB_Post__ = "post";
var __IDField__ = "id";
var __TB_Tag__ = "tag";
var __where_Field__ = "username";

module.exports = {
  all: () => {
    return db.load(`select * from  ${__TB_Post__}`);
  },

  countPostWithStt: (Field,key,id) => {
    return db.load(`select count(*) from post where ${Field} = ${key} and id_user = ${id}`);
  },

  postLimit: n => {
    return db.load(`select * from  ${__TB_Post__} where is_delete = 0 and status = 2 limit ${n}`);
  },

  allTags: () => {
    return db.load(`select * from  ${__TB_Tag__}`);
  },

  allWithDetails: () => {
    return db.load(`
      select c.*, count(p.ProID) as num_of_products
      from categories c left join products p on c.CatID = p.CatID
      group by c.CatID, c.CatName
    `);
  },

  single: id => {
    return db.load(`select * from ${__TB_Post__} where ${__IDField__} = ${id}`);
  },

  getComment: id => {
    return db.load(`select * from comment where id_post = ${id}`);
  },

  singleBy: (Field, Key) => {
    return db.load(`select * from ${__TB_Post__} where ${Field} = '${Key}'`);
  },

  singleByExist: (Field, Key, is_delete) => {
    return db.load(
      `select * from ${__TB_Post__} where ${Field} = '${Key}' and is_delete =  ${is_delete}`
    );
  },

  single_writer: id_user => {
    return db.load(`
    select w.*
    from users u join writer w on u.id = w.id_user
    where u.id = ${id_user}`);
  },

  pageById: (id, start_offset) => {
    var lim = config.paginate.default;
    return db.load(`select * from ${__TB_Post__} where id_user = ${id} limit ${lim} offset ${start_offset}`);
  },

  //pageByIdAndStt
  pageByIdAndStt: (id, start_offset,status) => {
    var lim = config.paginate.default;
    return db.load(`select * from ${__TB_Post__} where id_user = ${id} AND status =${status} limit ${lim} offset ${start_offset}`);
  },
  /**
   * @param {*} entity { CatName: ... }
   */
  add: entity => {
    return db.add(__TB_Post__, entity);
  },

  /**
   * @param {*} entity { id }
   */
  update: entity => {
    var id = entity.id;
    delete entity.id;
    return db.update("post", "id", entity, id);
  },

  remove: id => {
    return db.is_delete("post", "id", id, 1);
  },

  backup: id => {
    return db.is_delete("post", "id", id, 0);
  },

  delete: id => {
    return db.delete("post", "id", id);
  },

  addPost: entity => {
    return db.add("post", entity);
  },

  addComment: entity => {
    return db.add("comment", entity);
  },

  getViews: id=>{
    return db.load(`select * from post where id = ${id} `);
  }
};
