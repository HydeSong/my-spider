const express = require('express')
const cheerio = require('cheerio')
const fs = require('fs')
const axios = require('axios')
const rss = require('rss')
const ora = require('ora')

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

    for (const movieUrl of moviePageList) {
        const response = await axios.get(movieUrl)
        const $ = cheerio.load(response.data)

        // 获取电影详情
        // const poster = $('.content .article-header pic img').attr('src')
        const description = $('.content .info p').text()
        const date = new Date()
        // 获取磁力链接
        $('.down-list li .url-left a').each((index, element) => {
            const $element = $(element)
            const title = $element.attr('title').replace('磁力链下载', '')
            const url = $element.attr('href')
            if (url && url.includes('magnet')) {
                movies.push({
                    title,
                    // poster,
                    description,
                    url,
                    date
                })
            }
        })
    }

    return movies
}

// 生成 RSS
function generateRSS(items) {
    const feed = new rss({
        title: 'Movie RSS Feed',
        description: 'Get updates from www.mp4kan.com/custom/update.html',
        feed_url: 'https://example.com/rss.xml',
        site_url: 'https://example.com',
        language: 'en',
    })

    // 添加每个项目到 RSS
    for (const item of items) {
        feed.item({
            title: item.title,
            description: item.description,
            url: item.url,
            date: item.date,
        })
    }

    // 生成 RSS
    const xml = feed.xml()
    return xml
}

app.get('/rss', async (req, res, next) => {
    try {
        const spinner = ora('开始拉取订阅源').start();
        const moviePageList = await getMoviePageList()
        spinner.color = 'green'
        spinner.text = '成功获取最新更新电影列表 '
        const movies = await getMovies(moviePageList)
        console.log('movies磁力链接总共有 ', movies.length)
        spinner.text = '成功获取电影信息'
        const xml = generateRSS(movies)
        fs.writeFileSync('rss.xml', xml)
        spinner.text = '成功生成rss'
        res.setHeader('Content-Type', 'text/xml; charset=UTF-8')
        res.send(xml)
        spinner.text = '成功发送rss'
        spinner.stop()
        console.log('成功发送rss')
    } catch (err) {
        console.log('error....', err)
    }
})

app.listen(3000, function () {
    console.log('app is listening at port 3000')
})