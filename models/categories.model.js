var db = require("../utils/db");

var __TB_Category__ = "category";
var __IDField__ = "id";
var __where_Field__ = "username";
var __TB_SubCategory__ = "subcategory";

module.exports = {
  all: () => {
    return db.load(`select * from  ${__TB_Category__}`);
  },


  allSubCategory1: () => {
    return db.load(`select * from  ${__TB_SubCategory__}`);
  },

  allSubCategory_Dependent_Cat: () => {
    return db.load(`select cat.name as CatName, sub.*
    from ${__TB_Category__} cat left join  ${__TB_SubCategory__} sub on cat.id = sub.id_category`);
  },

  allWithDetails: () => {
    return db.load(`
      select c.*, count(p.ProID) as num_of_products
      from categories c left join products p on c.CatID = p.CatID
      group by c.CatID, c.CatName
    `);
  },

  single: id => {
    return db.load(
      `select * from ${__TB_Category__} where ${__IDField__} = ${id}`
    );
  },

  singleBy: (Table, Field, Key) => {
    return db.load(`select * from ${Table} where ${Field} = '${Key}'`);
  },
  
  singleByIs: (Table, Field, Key, is_delete) => {
    return db.load(
      `select * from ${Table} where ${Field} = '${Key}' and is_delete = '${is_delete}'`
    );
  },

  isSubcategoryDependentCategory: (id, id_category) => {
    return db.load(
      `select * from ${__TB_SubCategory__} where id = '${id}' and id_category = '${id_category}'`
    );
  },


  /**
   * @param {*} entity { CatName: ... }
   */
  add: entity => {
    return db.add(__TB_Category__, entity);
  },

  add_Table: entity => {
    var table = entity.table;
    delete entity.table;
    return db.add(table, entity);
  },

  /**
   * @param {*} entity { CatID, CatName }
   */
  update: entity => {
    var id = entity.id;
    delete entity.id;
    return db.update(__TB_Category__, "id", entity, id);
  },

  update_Table: entity => {
    var table = entity.table;
    delete entity.table;
    var id = entity.id;
    delete entity.id;
    return db.update(table, "id", entity, id);
  },

  delete: id => {
    return db.delete(__TB_Category__, "id", id);
  },
  deletesub: (id,table) => {
    return db.delete(table, "id", id);
  },
};
