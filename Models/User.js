const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
     userimage : String,
     reviews : Number,
     joinedDate : String,
     photos : Number,
     chatuid : String,
     
    local : {
        firstName : String,
        lastName : String,
        email : String,
        password : String,
        ZipCode : String

    },
    facebook : {
        id : String,
        token : String,
        email : String,
        name : String,
        //reviewf : Number
    },

    google : {
        id : String,
        token : String,
        email : String,
        name : String,
    },

    ReviewsSecUser : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Reviews'
        }
    ]

});

//generating hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password,bcrypt.genSaltSync(8),null);
};

//validating password
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password,this.local.password);
};

module.exports = mongoose.model('User',userSchema);