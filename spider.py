import requests
from bs4 import BeautifulSoup
import logging
from feedgen.feed import FeedGenerator

# 设置 RSS 的元数据
fg.id('https://www.example.com/rss')
fg.title('Movie RSS Feed')
fg.author({'name': 'Hyde Song', 'email': 'hyde.song@icloud.com'})
fg.link(href='https://www.example.com', rel='alternate')
fg.description('Get updates from www.mp4kan.com/custom/update.html')

# 设置日志级别为 DEBUG
logging.basicConfig(level=logging.DEBUG)

logging.debug('开始获取最新更新电影列表...')
# Define the URL of the movie list page
url = 'https://www.mp4kan.com/custom/update.html'

# Send a GET request to the URL and get the HTML content
response = requests.get(url)
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
        movie_links.append(a_tag)

logging.debug('获取的最新电影列表如下：')
logging.debug(movie_links)
logging.debug('最新更新电影总共有:', len(movie_links))

logging.debug('开始获取电影列表里每个电影的磁力链接...')
# Loop through each movie link and get the magnet link
magnet_links = []
for link in movie_links:
    # Get the URL of the movie page
    movie_url = link['href']

    # Send a GET request to the movie page and get the HTML content
    response = requests.get(movie_url)
    html_content = response.content

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')

    div_tags = soup.find_all('div', attrs={'class': 'url-left'})
    for div in div_tags:
        a_tag = li.find('a')
        if a_tag:
            magnet_links.append(a_tag['href'])
logging.debug('movies磁力链接总共有:', len(magnet_links))

# 遍历 magnet_links 数组，并将每个链接添加到 RSS 中
for link in magnet_links:
    fe = fg.add_entry()
    fe.id(link)
    fe.link(href=link)
    fe.title(link)
    fe.description(link)

logging.debug('生成rss...')
# 生成 RSS
rss = fg.rss_str(pretty=True)

# 将 RSS 内容写入 rss.xml 文件
with open('rss.xml', 'w') as f:
    f.write(rss)

# 打印成功消息
print('RSS saved to rss.xml')