const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const methodOverride = require('method-override');
const rs = require('./Models/Restaurant.js');
const User = require('./Models/User.js');
const Review = require('./Models/Reviews');
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname))
    }
});
var upload = multer(

    {
        storage: storage,
        fileFilter : function (req,file,cb) {
            checkFileType(file,cb);
        }

    }


).single('myImage');

function checkFileType(file,cb) {
    const filetype = /jpeg|jpg|png|gif/;

    const extname = filetype.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetype.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    }else{
        return cb('Error : Images only');
    }
}
const expresssession = require('express-session');
const app = express();

app.set("view engine", "ejs");
//require('./config/passport.js')(passport);
app.use(expresssession({ //session secret
    secret: "Blah Blah Blah",
    resave : false,
    saveUninitialized : false
}));

app.use(cookieParser());//read cookies (needed for auth)
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
mongoose.connect("mongodb://localhost/Yelp");

//passport config
app.use(passport.initialize());
app.use(passport.session());//persistent login sessions
app.use(flash());//use connect-flash for flashing messages stored in session

passport.serializeUser(function (user,done) {
    done(null,user.id);
});

passport.deserializeUser(function (id,done) {
    User.findById(id,function (err,user) {
        done(err,user);
    });
});

passport.use('local-signup',new LocalStrategy({  //signup Strategy

        usernameField : 'email',              //refer passport docs
        passwordField : 'password',
        passReqToCallback : true
    },
    function (req,username,password,done) {
    console.log(username);
    console.log(password);

    process.nextTick(function () {



            User.findOne({'local.email' : username},function (err,user) {
                if(err){
                    return done(err);
                }

                if(user){
                    return done(null,false,req.flash('signupMessage','That Email is Already Registered..Please Type Different Email'));
                }else {
                    // console.log(req.body.firstName);
                    // console.log(req.body.lastName);
                    var newUser = new User();
                    newUser.userimage = "";
                    newUser.reviews = -1;
                    newUser.local.email = username;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.firstName = req.body.firstName;
                    newUser.local.lastName = req.body.lastName;
                    newUser.local.ZipCode = req.body.zipcode;
                    newUser.ReviewsSecUser = [];
                    newUser.joinedDate = new Date().toDateString();
                    newUser.photos = 0;
                    // console.log(newUser);
                    // console.log('hiii');

                    newUser.save(function (err) {
                        if (err) {
                            console.log(err);
                        }

                        return done(null, newUser);
                    });
                }
            });
    });

    }
));

//local-login passport Strategy

passport.use('local-login',new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true

    },
    
    function (req,email,password,done) {
    
     User.findOne({'local.email' : email},function (err,user) {

         if(err){
             return done(err);
         }

         else if(!user){
             return done(null,false,req.flash('loginMessage','No user found..Please try again'));
         }

         else if(!user.validPassword(password)){
             return done(null,false,req.flash('loginMessage','Oopss..Wrong Password..please try again'));
         }

         else{
             return done(null,user);
         }
     });
        
    }


));

//facebook Strategy

var configAuth = require('./config/auth');
passport.use(new FacebookStrategy({

        clientID : configAuth.facebookAuth.clientID,
        clientSecret : configAuth.facebookAuth.clientSecret,
        callbackURL : configAuth.facebookAuth.callbackURL,
        // passReqToCallback : true,
        // profileFields: ['id', 'emails', 'name']

    },
    
    function (token,refreshToken,profile,done) {

    process.nextTick(function () {


        User.findOne({'facebook.id' : profile.id},function (err,user) {
            if(err){
                return done(err);
            }

            if(user){
                return done(null, user);
            }

            else{
                var newUser = new User();
                newUser.facebook.id = profile.id;
                newUser.facebook.token = token;
                newUser.facebook.name = profile.displayName;
                newUser.reviews = -1;
                newUser.userimage = "";
                newUser.ReviewsSecUser = [];
                newUser.joinedDate = new Date().toDateString();
                newUser.photos = 0;
                newUser.userimage = "";

                // newUser.facebook.email = profile.emails[0].value;
                //console.log(profile);

                newUser.save(function (err) {
                    if(err){
                        throw err;
                    }else{
                        return done(null,newUser);
                    }
                })

                // return done(null,newUser);
            }
        })
    })
    }

))

//passport google Strategy

passport.use(new GoogleStrategy({
    clientID        : configAuth.googleAuth.clientID,
    clientSecret    : configAuth.googleAuth.clientSecret,
    callbackURL     : configAuth.googleAuth.callbackURL,
    },
    
    function (token,refreshToken,profile,done) {
        console.log(profile);
    process.nextTick(function () {

        User.findOne({'google.id' : profile.id},function (err,user) {
            if(err){
                return done(err);
            }
            if(user){
                return done(null,user);
            }else{
                //var newUser = new User();
                console.log(profile._json.image);


                var newUser = new User();
                newUser.google.id    = profile.id;
                newUser.google.token = token;
                newUser.google.name  = profile.displayName;
                newUser.google.email = profile.emails[0].value; // pull the first email
                newUser.reviews = -1;
                newUser.ReviewsSecUser = [];
                newUser.userimage = profile._json.image.url;
                newUser.joinedDate = new Date().toDateString();
                newUser.photos = 0;

                // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }
        });
    });
    }

));









app.use(express.static(path.join(__dirname,'public')));
app.use('/biz',express.static(path.join(__dirname,'public')));



//landing page route
app.get('/',function (req,res) {
    // res.sendFile(path.join(__dirname,'public','index.html'));
    rs.find({},function (err,data) {
        if(err){
            console.log(err);
        }else{
            //console.log(data[0]._id);
            console.log(req.user)
            res.render('index',{data : data,user : req.user});
        }
    })
});

//signup route
app.get('/signup',function (req,res) {
    res.render("signup",{message : req.flash('signupMessage')});
});


//login route
app.get('/login',function (req,res) {
    res.render('login',{message : req.flash('loginMessage')});
});

//newplace route
app.get('/new',function (req,res) {
    res.render('new');
});


//new post route
app.post('/new',function (req,res) {
    let place = req.body.place;
    let source = req.body.source;
    let tags = req.body.tags;
    let address = req.body.address;
    let phnum = req.body.number;
    let website = req.body.website;
    let description = req.body.description;
    let lat = req.body.lat;
    let long = req.body.long;

    var d = new Date();

    var date = d.toDateString();
    //console.log(date);
    // console.log(place + " " + source + " " + tags + " " + address + " " + phnum + " " + website);
    let newRes = {
        place : place,
        coverimage : source,
        description : description,
        tags : tags,
        reviews : 0,
        address : address,
        phone : phnum,
        website : website,
        year : date,
        longitude : long,
        latitude : lat,
    };

    rs.create(newRes,function (err,newlycreated) {
        if(err){
            console.log(err);
        }else {
            console.log(newlycreated);
            res.render('new');
        }
    });
})


//place route

app.get('/biz/:id',function (req,res) {

    rs.findById(req.params.id).populate('ReviewsSec').exec(function (err,ress) {
        if(err){
            console.log(err);
        }else{
             //console.log(rs);
            //res.redirect('/');
            rs.find({},function (err2,data) {
                if(err2){
                    console.log(err2);
                }else{
                    //console.log('hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
                   // console.log(data);
                    res.render('res',{rs:ress,user:req.user,data:data});
                }
            })
        }
    })
})
//res.render('res',{rs:rs,user:req.user});
//newimage route

app.get('/profile',isLoggedIn,function (req,res) {

    User.find({},function (err,users) {
        if(err){
            throw err;
        }else{
            res.render('profile',{user:req.user,msg : "",users : users});
        }
    })

});

app.post('/profile',isLoggedIn,function (req,res) {
    upload(req,res,function (err) {
        if(err){
            res.render('profile',{msg : err,user : req.user})
        }else{
            //console.log(req.user);
            User.findById(req.user._id,function (err,user) {
                if(err){
                    throw err;
                }else{
                    if(req.file != undefined) {
                        user.userimage = req.file.filename;
                        user.save();
                        Review.find({},function(err,rev){
                           // console.log(rev)
                            rev.forEach(function(val){
                                if(req.user._id.equals(val.Author.id)){
                                    val.Author.image = req.user.userimage;
                                    val.save();

                                }
                                 
                            })
                        })
                    }
                    res.redirect('/profile');
                }
            })
        }
    })
})


app.post('/biz/:id/newimage',isLoggedIn,function (req,res) {
    rs.findById(req.params.id,function (err,rs) {
        if(err){
            console.log(err);
        }else{
            // console.log(rs.moreimages);
            User.findById(req.user._id,function (err,user) {
                if(err){
                    throw err;
                }else{

                    let p = user.photos;
                    p++;
                    user.photos = p;
                    user.save();
                    rs.moreimages.push(req.body.newimage);
                    rs.save();
                    res.redirect('/biz/' + req.params.id);
                }
            })
        }
    });

});

//new review route
app.post('/biz/:id/newreview',isLoggedIn,function (req,res) {

    var resid = req.params.id;
    var userid = req.user._id;
    var review = req.body.reviewcontent;
    if(review.length < 140){
        res.redirect('/biz/' + req.params.id);
        return;
    }


    rs.findById(resid,function (err,rs) {
        if(err){
            console.log(err);
        }else{
            let rsreviews = rs.reviews;
            rsreviews++;
            rs.reviews = rsreviews;
            rs.save();

            var rev = new Review();
            rev.review = review;
            rev.likes = 0;
            rev.date = new Date().toDateString();
            rev.Author.id = req.user._id;
            rev.Author.image = req.user.userimage;
            rev.ratings = parseInt(req.body.rating);
            rev.revlikeMap = [];
            //console.log(req.body.rating);

            if(req.user.local.firstName) {
                rev.Author.username = req.user.local.firstName + " " + req.user.local.lastName;
                rev.Author.islocal = true;

            }else if(req.user.facebook.name){

                rev.Author.username = req.user.facebook.name;
                rev.Author.islocal = true;
            }else{
                rev.Author.username = req.user.google.name;
                rev.Author.islocal = false;
            }

            let pr = new Promise(function (resolve,reject) {
                User.findById(req.user._id,function (err,user) {
                    if(err){
                        console.log(err);
                        reject(err);
                    }
                    else{
                         let r = req.user.reviews;
                         r++;
                        rev.Author.reviewNum = r;
                        rev.save();
                        user.reviews = r;
                        user.ReviewsSecUser.push(rev);
                        user.save();
                        resolve();
                    }

                })
            })
            pr.then(function () {

                new Promise(function (resolve,reject) {
                    //console.log('hiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');
                    User.findById(req.user._id).populate('ReviewsSecUser').exec(function (err,us) {
                        if(err){
                            console.log(err);
                            reject(err);
                        }
                        else{
                            us.ReviewsSecUser.forEach(function (userrev) {
                                console.log(userrev);
                                let r = userrev.Author.reviewNum;
                                r++;
                                userrev.Author.reviewNum = r;
                                userrev.save();
                                // console.log(userrev);
                                // console.log(userrev.Author);
                            });
                            setTimeout(function () {
                                resolve();
                            },1000);
                        }
                    })
                }).then(function () {
                    rs.ReviewsSec.push(rev);
                    rs.save(function (err) {
                        if(err){
                            console.log(err);
                        }else{
                            res.redirect('/biz/' + req.params.id);
                        }
                    });
                }).catch(function (err) {
                    console.log(err);
                })
            }).catch(function (err) {
                console.log(err);
            })




        }
    })
})

//edit review

app.post('/biz/:id/editrev',IsAuthenticatedReview,function (req,res) {
    Review.findById(req.params.id,function (err,rev) {
        if(err){
            console.log(err)
        }else{
            rev.review = req.body.editcontent;
            rev.save();
            res.redirect('back');
        }
    })
});

//delete review

app.post('/biz/:id/:id2/deleterev',IsAuthenticatedReview,function (req,res) {
    Review.findByIdAndRemove(req.params.id,function (err) {
        if(err){
            console.log(err);
        }else{

            // reduce reviewnum on  rs and reduce user reviews
            rs.findById(req.params.id2,function (err2,ress) {
                if(err2){
                    throw err2;
                }else{
                    console.log(ress)
                    let r = ress.reviews;
                    r--;
                    ress.reviews = r;
                    ress.save();
                    User.findById(req.user._id,function (err3,user) {
                        if(err3){
                            console.log(err3);
                        }else{
                            let r1 = user.reviews;
                            r1--;
                            user.reviews = r1;
                            user.save();
                            res.redirect('back');
                        }
                    })
                }
            })

        }
    })
})

//local login-signup
app.post('/signup',passport.authenticate('local-signup',{
    successRedirect : '/',
    failureRedirect : '/signup',
    failureFlash : true
}));

app.post('/login',passport.authenticate('local-login',{

    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

//like review
app.post('/likerev',function(req,res){
    Review.findById(req.body.revid,function(err,rev){
         
         console.log(req.body.userid);
        
         if(rev.revlikeMap.indexOf(req.body.userid) == -1){
            rev.likes++;
            rev.revlikeMap.push(req.body.userid);
         }else{
             rev.likes--;
             let index = rev.revlikeMap.indexOf(req.body.userid) ;
             rev.revlikeMap.splice(index,1);
         }
         rev.save();
         console.log(rev);
    })
})

//facebook login-signup

app.get('/auth/facebook',passport.authenticate('facebook',{scope : ['email']}));

app.get('/auth/facebook/callback',

    passport.authenticate('facebook',{
        successRedirect : '/',
        failureRedirect : '/login'
    }));

//google login-signup

app.get('/auth/google',passport.authenticate('google',{scope : ['https://www.googleapis.com/auth/plus.login','profile','email']}));
app.get('/auth/google/callback',
    passport.authenticate('google',{

        successRedirect : '/',
        failureRedirect : '/login'
        })

    );





//logout route
app.get('/logout',function (req,res) {
    req.logout();
    res.redirect('/');
});


function IsAuthenticatedReview(req, res, next) {
    if (req.isAuthenticated()) {
        console.log(req.params.id);
        Review.findById(req.params.id, function (err, foundreview) {
            if (err) {
                res.redirect("back");
            } else {
                console.log(foundreview)
                if (foundreview.Author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect('back');
                }
            }
        });
    } else {
        res.redirect("/login")
    }
}


function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }else{
        req.flash('loginMessage','Please Login First');
        res.redirect('/login');
    }
}


app.listen(80,function () {
    console.log('Server Started On Port 80');
})
