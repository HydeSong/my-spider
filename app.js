const express = require('express')
const cheerio = require('cheerio')
const fs = require('fs')
const axios = require('axios')
const rss = require('rss')

const app = express()
const baseURL = 'https://www.mp4kan.com'

// 爬取电影列表页面
async function getMoviePageList() {
    const url = `${baseURL}/custom/update.html`
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const moviePageList = []

    // 获取每个电影页面的链接
    $('.index_update .list-group-item a').each((index, element) => {
        const movieUrl = `${baseURL}${$(element).attr('href')}`
        moviePageList.push(movieUrl)
    })

    return moviePageList
}

// 爬取每个电影页面的磁力链接数据
async function getMovies(moviePageList) {
    const movies = []
    const url = []

    for (const movieUrl of moviePageList) {
        const response = await axios.get(movieUrl)
        const $ = cheerio.load(response.data)

        // 获取电影详情
        const title = $('.content .article-header h1').text()
        const poster = $('.content .article-header pic img').attr('src')
        const description = $('.content .info p').text()
        // 获取磁力链接
        $('.down-list li .url-left a').each((index, element) => {
            const $element = $(element)
            const href = $element.attr('href')
            href && href.includes('magnet') && url.push(href)
        })
        movies.push({
            title,
            poster,
            description,
            url: url[0]
        })
    }

    console.log(JSON.stringify(movies))
    return movies
}

// 生成 RSS
function generateRSS(items) {
    const feed = new rss({
        title: 'My RSS Feed',
        description: 'A description of my RSS feed',
        feed_url: 'https://example.com/rss.xml',
        site_url: 'https://example.com',
        language: 'en',
    })

    // 添加每个项目到 RSS
    for (const item of items) {
        feed.item({
            title: item.title,
            poster: item.poster,
            description: item.description,
            url: item.url
        })
    }

    // 生成 RSS 并写入文件
    const xml = feed.xml()
    return xml
}

app.get('/rss', async (req, res, next) => {
    try {
        console.log('开始拉取订阅源')
        const moviePageList = await getMoviePageList()
        console.log('成功获取最新更新电影列表')
        const movies = await getMovies(moviePageList)
        console.log('成功获取电影信息')
        const xml = generateRSS(movies)
        console.log('成功生成rss')
        fs.writeFileSync('rss.xml', xml)
        res.setHeader('Content-Type', 'text/xml; charset=UTF-8')
        res.send(xml)
        console.log('success')
    } catch (err) {
        console.log('error....', err)
    }
})

app.listen(3000, function () {
    console.log('app is listening at port 3000')
})