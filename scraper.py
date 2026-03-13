"""
Apple Music 专辑信息爬虫模块
支持单条和批量抓取
"""

import json
import re
import requests
from urllib.parse import unquote


class AppleMusicScraper:
    """Apple Music 专辑爬虫类"""

    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
        }

    def scrape(self, url):
        """
        抓取单个专辑信息

        Args:
            url: Apple Music 专辑 URL

        Returns:
            dict: 包含 album_name, artist, release_date, cover_url, tracks 等

        Raises:
            Exception: 抓取失败时抛出异常
        """
        url = url.strip()
        if not url:
            raise ValueError("URL 不能为空")

        try:
            response = self.session.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            # 确保正确解码
            if response.encoding is None:
                response.encoding = 'utf-8'
            html = response.text

            # 处理可能的乱码
            if 'å' in html and '原' not in html:
                try:
                    html = response.content.decode('utf-8')
                except:
                    pass

            return self._parse_html(html, url)

        except requests.RequestException as e:
            raise Exception(f"网络请求失败: {str(e)}")
        except Exception as e:
            raise Exception(f"解析失败: {str(e)}")

    def _parse_html(self, html, source_url):
        """解析 HTML 提取专辑信息"""
        # 提取 JSON-LD 数据
        json_ld_pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
        matches = re.findall(json_ld_pattern, html, re.DOTALL)

        album_data = None

        for match in matches:
            try:
                data = json.loads(match)
                if isinstance(data, dict) and data.get('@type') == 'MusicAlbum':
                    album_data = data
                    break
            except json.JSONDecodeError:
                continue

        if not album_data:
            raise ValueError("未找到专辑数据，请检查链接是否正确")

        # 解析专辑信息
        by_artist = album_data.get('byArtist', {})
        if isinstance(by_artist, list):
            artist_name = by_artist[0].get('name', '') if by_artist else ''
        else:
            artist_name = by_artist.get('name', '')

        # 获取封面图片
        cover_url = ''
        if 'image' in album_data:
            images = album_data['image']
            if isinstance(images, str):
                cover_url = images
            elif isinstance(images, list) and images:
                if isinstance(images[0], dict):
                    cover_url = images[0].get('url', '')
                elif isinstance(images[0], str):
                    cover_url = images[0]
            elif isinstance(images, dict):
                cover_url = images.get('url', '')

        # 解析歌曲列表
        tracks_raw = album_data.get('tracks', [])
        if isinstance(tracks_raw, dict):
            tracks_data = tracks_raw.get('itemListElement', [])
        else:
            tracks_data = tracks_raw

        tracks = []
        for i, item in enumerate(tracks_data, 1):
            if isinstance(item, dict) and 'item' in item:
                track = item['item']
            else:
                track = item

            if track and isinstance(track, dict):
                duration_iso = track.get('duration', '')
                duration = self._parse_duration(duration_iso)

                tracks.append({
                    'index': i,
                    'name': track.get('name', ''),
                    'play_url': track.get('url', ''),
                    'duration': duration,
                    'duration_iso': duration_iso,
                    'preview_url': track.get('audio', {}).get('contentUrl', '') if 'audio' in track else ''
                })

        return {
            'album_name': album_data.get('name', ''),
            'artist': artist_name,
            'release_date': album_data.get('datePublished', ''),
            'cover_url': cover_url,
            'description': album_data.get('description', ''),
            'source_url': source_url,
            'track_count': len(tracks),
            'tracks': tracks
        }

    def _parse_duration(self, iso_duration):
        """将 ISO 8601 时长转换为 mm:ss 格式"""
        if not iso_duration:
            return ''

        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', iso_duration)
        if match:
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            seconds = int(match.group(3) or 0)

            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                return f"{minutes}:{seconds:02d}"

        return iso_duration

    def scrape_batch(self, urls, progress_callback=None):
        """
        批量抓取专辑信息

        Args:
            urls: URL 列表
            progress_callback: 进度回调函数，接收 (current, total, url, success, result)

        Returns:
            list: 结果列表，每项包含 {success, url, data/error}
        """
        results = []
        total = len(urls)

        for i, url in enumerate(urls, 1):
            url = url.strip()
            if not url:
                continue

            try:
                data = self.scrape(url)
                result = {'success': True, 'url': url, 'data': data}
            except Exception as e:
                result = {'success': False, 'url': url, 'error': str(e)}

            results.append(result)

            if progress_callback:
                progress_callback(i, total, url, result['success'], result)

        return results


# 便捷函数
def scrape_album(url):
    """抓取单个专辑"""
    scraper = AppleMusicScraper()
    return scraper.scrape(url)


def scrape_albums(urls, progress_callback=None):
    """批量抓取专辑"""
    scraper = AppleMusicScraper()
    return scraper.scrape_batch(urls, progress_callback)
