var user = new User({
    username: config.get("default:user:username"),
    password: config.get("default:user:password"),
    phone: config.get("default:user:phone"),
});

user.save(function(err, user) {
    if(!err) {
        log.info("New user - %s:%s", user.username, user.password);
    }else {
        return log.error(err);
    }
});
