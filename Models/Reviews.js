var mongoose = require('mongoose');
var reviewSchema = mongoose.Schema({

    revlikeMap : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }
    ],
    review : String,
    ratings : Number,
    likes : Number,
    date : String,
   Author : {
       id:{
           type : mongoose.Schema.Types.ObjectId,
           ref : "User"
       },

       username : String,
       image : String,
       reviewNum : Number,
       islocal : Boolean
   }

});

module.exports = mongoose.model('Reviews',reviewSchema);