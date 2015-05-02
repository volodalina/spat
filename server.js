var express = require('express')
    , expressApp      = express()
    , port            = 8888
    , fs = require('fs')
    , router = express.Router();


expressApp.use('/', router);
expressApp.use(express.static(__dirname));

router.use(function(req, res, next) {
    next();
});

var faker = require('Faker');
router.get('/fakeNews', function(req, res) {

    var limit = parseInt(req.query.limit);
    var defaultNewsCount = 3;
    if (limit <= 100 && limit >= 2 ){
        //OK
    }else{
        limit = defaultNewsCount;
    }
    console.log('Browser requested ' + limit + ' news');
    res.send(GetFakerNews(limit));
});

function GetFakerNews(limit) {
    var ArrNews = [];
    var index;
    for(index=0; index < limit; ++index) {
        var newsFaker = {
            id: faker.PhoneNumber.phoneNumber(),
            message: faker.Company.catchPhrase(),
            from: faker.Name.findName(),
            picture: faker.Image.avatar(),
            link: faker.Image.imageUrl(),
            source: faker.Image.imageUrl(),
            description: faker.Lorem.paragraph(),
            created_time: faker.Date.between(2014, 2015),
            updated_time: faker.Date.between(2014, 2015)
        };
        ArrNews.push(newsFaker);
    }
    return ArrNews;
}

var debugHTML = fs.readFileSync(__dirname + '/debug.html', 'utf8');

router.get('/', function(req, res) {
    res.send(debugHTML);
});

expressApp.listen(port);
console.log('Listening on port: ', port);

