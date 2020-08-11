var db = require("../utils/db");
var config = require("../config/default.json");

module.exports = {
  AllPost :(start_offset)=>{
    var lim = config.paginate.default;
    return db.load(`select * from post limit ${lim} offset ${start_offset}`);
  },
  ApprovalPost: entity => {
    var id = entity.id;
    delete entity.id;
    return db.update('post','id',entity,id);
  },
  countPostWithStt: (status)=>{
    return db.load(`select count(*) from post where status = ${status}`);

  },
  pageByStt : (start_offset,status)=>{
    var lim = config.paginate.default;
    return db.load(`select * from post where  status =${status} limit ${lim} offset ${start_offset}`);
  }

};
