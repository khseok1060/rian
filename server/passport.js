import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from './models/User';
import config from './config';
const facebookAuth = config.facebookAuth;

export default function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    // attach req.session.passport.user = { // our serialised user object // }.


    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    
    // code for login (use('local-login', new LocalStategy))
    // code for signup (use('local-signup', new LocalStategy))

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : facebookAuth.clientID,
        clientSecret    : facebookAuth.clientSecret,
        callbackURL     : facebookAuth.callbackURL,
        profileFields   : ['email','id', 'first_name', 'gender', 'last_name', 'picture']

    },

    // facebook will send back the token and profile
    function(token, refreshToken, profile, done) {
    	console.log("TOKEN: ", token);
    	console.log("PROFILE: ",profile);
        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser            = new User();

                    // set all of the facebook information in our user model
                    var userEmail = profile.email || profile.emails[0].value || "null";
                    newUser.facebook.id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.facebook.email = userEmail; // facebook can return multiple emails so we'll take the first
                    newUser.facebook.picture = profile.photos[0].value
                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }

            });
        });

    }));

};