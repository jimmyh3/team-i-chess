
const ensureAuth = (request, response, next) =>{
    if (request.isAuthenticated()) {
        response.locals.isLoggedIn = true;
        return next();
    } else {
        request.flash('error_msg', 'Not Logged in');
        response.redirect('/users/login');
    }
};


module.exports = ensureAuth;