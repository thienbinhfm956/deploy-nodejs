var postModel = require("../models/post.model");

module.exports =async (req,res,next) => {
    const {id} = req.params;
    const row = await postModel.single(id);
    if(row[0].is_premium == 1 && !req.user){
        
        return res.redirect(`/users/login?retUrl=${req.originalUrl}`);
    }
    next();
}