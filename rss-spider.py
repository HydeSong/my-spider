import requests
from bs4 import BeautifulSoup
import logging
import PyRSS2Gen
import datetime

# 设置日志级别为 INFO
logging.basicConfig(level=logging.INFO)

logging.info('开始获取最新更新电影列表...')
# Define the URL of the movie list page
baseURL = 'https://www.mp4kan.com'
url = baseURL + '/custom/update.html'

#请求头
headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36\
    (KHTML, like Gecko) Chrome/75.0.3770.142 Mobile Safari/537.36',
    'Content-Type': 'text/html; charset=utf-8',
}

# Send a GET request to the URL and get the HTML content
response = requests.get(url, headers=headers)
html_content = response.content

# Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(html_content, 'html.parser')

# Find all the movie links on the page
# 查找 li.list-group-item 标签
li_tags = soup.find_all('li', attrs={'class': 'list-group-item'})
# 遍历 div 标签，并查找其中的 a 标签
movie_links = []
for li in li_tags:
    a_tag = li.find('a')
    if a_tag:
        a_tag['href'] = baseURL + a_tag['href']
        movie_links.append(a_tag)

logging.info('获取的最新电影列表如下：')
logging.info(movie_links)
logging.info('最新更新电影总共有:')
logging.info(len(movie_links))

logging.info('开始获取电影列表里每个电影的磁力链接...')
# Loop through each movie link and get the magnet link
rssItems = []
for link in movie_links:
    # Get the URL of the movie page
    movie_url = link['href']

    # Send a GET request to the movie page and get the HTML content
    response = requests.get(movie_url, headers=headers)
    html_content = response.content

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    description = soup.find('div', {'class': 'info'}).find('p').text
    div_tags = soup.find_all('div', attrs={'class': 'url-left'})
    for div in div_tags:
        m_tag = div.find('a')
        if m_tag:
            if 'magnet' in m_tag['href']:
                title = m_tag['title'].replace('磁力链下载', '').replace('电驴下载', '')
                rssItem = PyRSS2Gen.RSSItem(				
                    title=title,	
                    link=m_tag['href'],		
                    description = str(description),	
                    #时间需要根据网站发布信息的时间单独计算然后格式化
                    pubDate = datetime.datetime.now()
                )
                rssItems.append(rssItem)

logging.info('磁力链接总共有:')
logging.info(len(rssItems))

rss = PyRSS2Gen.RSS2(
	title = "Movie RSS Feed", 
	link = 'https://www.example.com/rss',
	description = "Get updates from www.mp4kan.com/custom/update.html", 
	lastBuildDate = datetime.datetime.now(),
	items = rssItems
)

rss.write_xml(open('rss.xml', "w",encoding='utf-8'),encoding='utf-8')

# 打印成功消息
print('RSS saved to rss.xml')