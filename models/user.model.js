var db = require("../utils/db");

var __TB_Users__ = "users";
var __IDField__ = "id";
var __where_Field__ = "username";
var __TB_Writer__ = "writer";

module.exports = {
  all: () => {
    return db.load(`select * from  ${__TB_Users__}`);
  },

  allForView: () => {
    return db.load(`
    SELECT u.id, displayname, username, up.key as permission, created_date, is_delete
    FROM users as u join user_permission as up on u.id_permission = up.id`);
  },

  allWriters: () => {
    return db.load(`select * from  ${__TB_Writer__}`);
  },
  singleWritersByIdUser: id => {
    return db.load(
      `select pseudonym from  ${__TB_Writer__} where id_user = ${id}`
    );
  },

  single: id => {
    return db.load(
      `select * from ${__TB_Users__} where ${__IDField__} = ${id}`
    );
  },

  singleByUserName: userName => {
    return db.load(
      `select * from ${__TB_Users__} where ${__where_Field__} = '${userName}'`
    );
  },

  add: entity => {
    return db.add(__TB_Users__, entity);
  },

  addSubscriber: entity => {
    return db.add("subscriber", entity);
  },

  update: entity => {
    var id = entity.id;
    delete entity.id;
    return db.update(__TB_Users__, __IDField__, entity, id);
  },

  //update isDelete = 1
  remove: id => {
    return db.is_delete(__TB_Users__, __IDField__, id,1);
  },

  delete: id => {
    return db.delete(__TB_Users__, __IDField__, id);
  },
  allpermission: () =>{
    return db.load(`select * from  user_permission`);
  }
};
