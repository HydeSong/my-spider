var express = require('express');
var cheerio = require('cheerio');
var superagent = require('superagent');
var fs = require('fs');

var app = express();
var baseURL = 'https://www.mp4kan.com';

app.get('/', (req, res, next) => {
    superagent
        .get(baseURL + '/custom/update.html')
        .end((err, sres) => {
            if (err) {
                return next(err);
            }
            var $ = cheerio.load(sres.text);
            var items = [];
            $('.index_update .list-group-item a').each(function (idx, element) {
                var $element = $(element);
                items.push({
                    title: $element.attr('title'),
                    href: baseURL + $element.attr('href'),
                });
            });

            var details = [];
            items.map(item => {
                console.log('########item########', item)
            })
            items.forEach(item => {
                superagent.get(item.href).end((err, sres) => {
                    if (err) {
                        return next(err);
                    }
                    var $ = cheerio.load(sres.text);
                    $('.down-list li .url-left a').each(function (index, element) {
                        var $element = $(element);
                        details.push($element.attr('href'));
                    });
                    console.log('details', details.length)
                    fs.writeFile(
                        'resource.txt',
                        JSON.stringify([...new Set(details)]),
                        function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            console.log('写入成功');
                        }
                    );
                });
            });

            res.send(items);
        });
});

app.listen(3000, function () {
    console.log('app is listening at port 3000');
});
