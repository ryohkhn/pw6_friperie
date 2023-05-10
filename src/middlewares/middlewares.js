function validateCategory(req, res, next) {
    const allowedCategories = ['pantalons', 'shorts', 'chemises','vestes','pulls','costumes','manteaux','robes','chaussettes'];
    const type = req.params.type;

    if (allowedCategories.includes(type)) {
        next();
    } else {
        res.redirect('/');
    }
}

function isAuthentificated(req){
    return((req.session && req.session.user));
}

function hasRole(requiredRole) {
}

module.exports = {
    validateCategory,
    isAuthentificated,
    hasRole,
};