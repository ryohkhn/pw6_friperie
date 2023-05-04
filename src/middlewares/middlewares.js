function validateCategory(req, res, next) {
    const allowedCategories = ['pantalons', 'shorts', 'chemises','vestes','pulls','costumes','manteaux','robes','chaussettes'];
    const type = req.params.type;

    if (allowedCategories.includes(type)) {
        next();
    } else {
        res.redirect('/');
    }
}

function isAuthenticated(req, res, next) {
}

function hasRole(requiredRole) {
}

module.exports = {
    validateCategory,
    isAuthenticated,
    hasRole,
};