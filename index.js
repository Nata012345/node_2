const http = require('http');
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;
const filePath = './api/articles.json';
const articles = [];

const handlers = {
    '/api/articles/readall' : readArticles,
    '/api/articles/read' : readArticlesById,
    '/api/articles/create' : addNewArticle,
    // '/api/articles/update' : sum,
    '/api/articles/delete' : deleteArticleById,
    // '/api/comments/create' : sum,
    // '/api/comments/delete' : sum,
};
const server = http.createServer((req, res) => {
    parseBodyJson(req, (err, body) => {
        const handler = getHandler(req.url);
        handler(req, res, body, (err, result) => {
            if (err) {
                res.statusCode = err.code;
                res.setHeader('Content-Type', 'application/json');
                res.end( JSON.stringify(err) );
                return;
            }
            res.statusCode = result.statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end( JSON.stringify(result.data) );
        });
    });
});
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
// -------------------- handlers функции -------------------
function readArticles(req, res, body, cb){
    const data = fs.readFileSync(filePath, {encoding: 'utf8', flag: 'r'});
    const fbData = {
        data: data,
        statusCode: 200
    }
    cb(null, fbData);
}
function addNewArticle(req, res, body, cb) {
    const newArticle = {
        id : articles.length + 1,
        title : body.title,
        text : body.text,
        data: body.data,
        author: body.author,
        comments : []
    };
    writeArticleToFile(newArticle);
    const fbData = {
        data: newArticle,
        statusCode: 201
    }
    cb(null, fbData);
}
function deleteArticleById(req, res, body, cb){
    const id = findIdValue(req);
    const article = findId(id, articles);
    let fbData = null;
    if (article) {
        const articleIndex = id - 1;
        articles.splice(articleIndex, 1);
        writeFile(articles);
        fbData = {
            data: article,
            statusCode: 200
        }
    } else {
        fbData = {
            data: {'err': 'article not found'},
            statusCode: 404
        }
    }
    cb(null, fbData);
}
function readArticlesById(req, res, body, cb) {
    const id = findIdValue(req);
    let fbData = null;
    const article = findId(id, articles);
    if (article) {
        fbData = {
            data: article,
            statusCode: 200
        }
    } else {
        fbData = {
            data: {'err': 'article not found'},
            statusCode: 404
        }
    }
    cb(null, fbData);
}
// -------------------- вспомогательные функции -------------------
function findArticleById(){i
}
function findIdValue(req) {
    const current_url = new URL('http://localhost' + req.url);
    const search_params = current_url.searchParams;
    const idValue = parseInt(search_params.get('id'), 10);
    return idValue;
}
function writeArticleToFile(article) {
    articles.push(article);
    writeFile(articles);
}
function findId(id, articles) {
    return articles.find(item => item.id === id);
}
// -------------------- функции чтения записи -------------------
function writeFile(data){
    fs.writeFile(filePath, JSON.stringify(data), {encoding : 'utf8', flag: 'w'}, (err) => {});
}
// -------------------- функции сервера -------------------
function getHandler(url) {
    let urlSplit = url.split('?')[0];
    return handlers[urlSplit] || notFound;
}
function parseBodyJson(req, cb) {
    let bodyByte = [];
    req.on('data', function(chunk) {
        bodyByte.push(chunk);
    }).on('end', function() {
        let bodyStr = Buffer.concat(bodyByte).toString();
        let resultBody = null
        if (bodyStr.length) {
            resultBody = JSON.parse(bodyStr);
        }
        cb(null, resultBody);
    })
}
function notFound(req, res, body, cb) {
    cb({ code: 404, message: 'Not found' });
}