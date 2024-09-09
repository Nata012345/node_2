const http = require('http');
const fs = require('fs');
const path = require('path');
const hostname = '127.0.0.1';
const port = 3000;
const filePath = './api/articles.json';
const articles = [];
const logPath = path.json(__dirname, 'log.txt');

const handlers = {
    '/api/articles/readall' : readArticles,
    '/api/articles/read' : readArticlesById,
    '/api/articles/create' : addNewArticle,
    '/api/articles/update' : updateArticleById,
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

            // записываем в файл log время + eventType + statusCode
            createLog(req, res, body);
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
        statusCode: 200,
        eventType: req.url
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
        statusCode: 201,
        eventType: req.url
    }
    cb(null, fbData);
}
function updateArticleById(req, res, body, cb) {
    const id = findIdValue(req);
    const article = findId(id, articles);
    let newParams = body;
    for(let key in newParams){
        article[key] = newParams[key];
    }
    articles[id - 1] = article;
    writeFile(articles);
    const fbData = {
        data: article,
        statusCode: 200,
        eventType: req.url
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
        rewriteID();
        writeFile(articles);
        fbData = {
            data: articles,
            statusCode: 200,
            eventType: req.url
        }
    } else {
        fbData = {
            data: {'err': 'article not found'},
            statusCode: 404,
            eventType: req.url
        }
    }
    cb(null, fbData);
}
function readArticlesById(req, res, body, cb) {
    const id = findIdValue(req);
    const article = findId(id, articles);
    let fbData = null;
    if (article) {
        fbData = {
            data: article,
            statusCode: 200,
            eventType: req.url
        }
    } else {
        fbData = {
            data: {'err': 'article not found'},
            statusCode: 404,
            eventType: req.url
        }
    }
    cb(null, fbData);
}
// -------------------- вспомогательные функции -------------------
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
function rewriteID() {
    for (let i = 0; i < articles.length; i++) {
        articles[i].id = i;
    }
}
// -------------------- функции чтения записи -------------------
function writeFile(data){
    fs.writeFile(filePath, JSON.stringify(data), {encoding : 'utf8', flag: 'w'}, (err) => {});
}
// -------------------- функции сервера -------------------
function createLog(req, res, body) {
    const c = newDate().toString();
    const logRaw =
        `
        ${time}
        ${req.url}
        ${req.method}
        ${body ? body : 'no body'}
      ------------------------------\n`;
    fs.appendFile(logPath, logRaw, 'utf8', (err)=>{});
}
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