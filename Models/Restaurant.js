var mongoose = require('mongoose');
var restaurantSchema = mongoose.Schema({
    place : String,
    moreimages : [
        {
            type : String
        }
    ],

    coverimage : String,
    description : String,
    tags : String,
    reviews : Number,
    address : String,
    phone : String,
    website : String,
    year : String,
    latitude : Number,
    longitude : Number,

    // Author : {
    //     id : {
    //         type : mongoose.Schema.Types.ObjectId,
    //         ref : "Comment"
    //     },
    //
    //     username : String
    // },

    ReviewsSec : [
        //comment section

           {
                type: mongoose.Schema.Types.ObjectId,
                ref : "Reviews"
            }

    ]
});

module.exports = mongoose.model('restaurants',restaurantSchema);