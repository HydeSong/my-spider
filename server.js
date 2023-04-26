var connect = require("connect");
var serveStatic = require("serve-static");
var app = connect();
app.use(serveStatic("./"));
app.listen(3000, function () {
    console.log('app is listening at port 3000')
})