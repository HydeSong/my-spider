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
    try {
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
    } catch (error) {
        console.error(error)
    }
}

// 爬取每个电影页面的磁力链接数据
async function getMovies(moviePageList) {
    const movies = []

    for (const movieUrl of moviePageList) {
        try {
            const response = await axios.get(movieUrl)
            const $ = cheerio.load(response.data)

            // 获取电影详情
            // const poster = $('.content .article-header pic img').attr('src')
            const description = $('.content .info p').text()
            const date = new Date()
            // 获取磁力链接
            $('.down-list li .url-left a').each((index, element) => {
                const $element = $(element)
                const title = $element.attr('title').replace('磁力链下载', '').replace('电驴下载', '')
                console.log('title:', title)
                const url = $element.attr('href')
                if (url && url.includes('magnet')) {
                    movies.push({
                        title,
                        description,
                        url,
                        date
                    })
                }
            })

        } catch (error) {
            console.error(error)
        }
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
        const spinner = ora('开始获取最新更新电影列表...').start();
        const moviePageList = await getMoviePageList()

        spinner.text = '\n开始获取电影列表里每个电影的磁力链接...'
        const movies = await getMovies(moviePageList)
        console.log('movies磁力链接总共有 ', movies.length)

        spinner.text = '开始生成rss...'
        const xml = generateRSS(movies)

        spinner.text = '开始把rss保存为文件...'
        fs.writeFileSync('rss.xml', xml)

        spinner.text = '开始发送rss文件到客户端...'
        res.setHeader('Content-Type', 'text/xml; charset=UTF-8')
        res.send(xml)

        spinner.stop()
        console.log('今日更新电影磁力链接获取成功')
    } catch (err) {
        console.log('error....', err)
    }
})

app.listen(3000, function () {
    console.log('app is listening at port 3000')
})