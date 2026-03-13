/**
 * Apple Music Scraper 前端交互逻辑
 */

// 全局状态
const state = {
    mode: 'single', // 'single' | 'batch'
    isLoading: false,
    results: [], // 存储所有成功抓取的结果
    currentBatchIndex: 0,
    totalBatch: 0
};

// DOM 元素
const elements = {
    // 标签
    tabSingle: document.getElementById('tab-single'),
    tabBatch: document.getElementById('tab-batch'),

    // 输入区域
    inputSingle: document.getElementById('input-single'),
    inputBatch: document.getElementById('input-batch'),
    urlSingle: document.getElementById('url-single'),
    urlsBatch: document.getElementById('urls-batch'),
    urlCount: document.getElementById('url-count'),

    // 按钮
    btnScrapeSingle: document.getElementById('btn-scrape-single'),
    btnScrapeBatch: document.getElementById('btn-scrape-batch'),
    btnDownloadJson: document.getElementById('btn-download-json'),
    btnDownloadExcel: document.getElementById('btn-download-excel'),
    jsonBtnText: document.getElementById('json-btn-text'),
    excelBtnText: document.getElementById('excel-btn-text'),

    // 加载和结果
    loadingSection: document.getElementById('loading-section'),
    batchProgress: document.getElementById('batch-progress'),
    loadingText: document.getElementById('loading-text'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    progressBar: document.getElementById('progress-bar'),
    currentUrl: document.getElementById('current-url'),
    resultsSection: document.getElementById('results-section'),
    albumsContainer: document.getElementById('albums-container'),
    batchStats: document.getElementById('batch-stats'),
    statsDetail: document.getElementById('stats-detail'),
    statsSuccess: document.getElementById('stats-success'),
    statsFail: document.getElementById('stats-fail'),
    downloadSection: document.getElementById('download-section'),

    // 错误提示
    errorToast: document.getElementById('error-toast'),
    errorMessage: document.getElementById('error-message')
};

// 初始化
function init() {
    bindEvents();
}

// 绑定事件
function bindEvents() {
    // 标签切换
    elements.tabSingle.addEventListener('click', () => switchMode('single'));
    elements.tabBatch.addEventListener('click', () => switchMode('batch'));

    // 输入框回车
    elements.urlSingle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') scrapeSingle();
    });

    // 批量输入计数
    elements.urlsBatch.addEventListener('input', updateUrlCount);

    // 抓取按钮
    elements.btnScrapeSingle.addEventListener('click', scrapeSingle);
    elements.btnScrapeBatch.addEventListener('click', scrapeBatch);

    // 下载按钮
    elements.btnDownloadJson.addEventListener('click', downloadJson);
    elements.btnDownloadExcel.addEventListener('click', downloadExcel);
}

// 切换模式
function switchMode(mode) {
    state.mode = mode;

    if (mode === 'single') {
        elements.tabSingle.classList.add('tab-active');
        elements.tabSingle.classList.remove('tab-inactive');
        elements.tabBatch.classList.add('tab-inactive');
        elements.tabBatch.classList.remove('tab-active');

        elements.inputSingle.classList.remove('hidden');
        elements.inputBatch.classList.add('hidden');
    } else {
        elements.tabBatch.classList.add('tab-active');
        elements.tabBatch.classList.remove('tab-inactive');
        elements.tabSingle.classList.add('tab-inactive');
        elements.tabSingle.classList.remove('tab-active');

        elements.inputBatch.classList.remove('hidden');
        elements.inputSingle.classList.add('hidden');
    }

    // 清空之前的结果
    clearResults();
}

// 更新 URL 计数
function updateUrlCount() {
    const urls = elements.urlsBatch.value.split('\n').filter(u => u.trim());
    elements.urlCount.textContent = urls.length;
}

// 清空结果
function clearResults() {
    state.results = [];
    elements.resultsSection.classList.add('hidden');
    elements.albumsContainer.innerHTML = '';
    elements.batchStats.classList.add('hidden');
}

// 显示错误
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorToast.classList.remove('-translate-y-20', 'opacity-0');

    setTimeout(() => {
        elements.errorToast.classList.add('-translate-y-20', 'opacity-0');
    }, 3000);
}

// 设置加载状态
function setLoading(loading) {
    state.isLoading = loading;

    elements.btnScrapeSingle.disabled = loading;
    elements.btnScrapeBatch.disabled = loading;
    elements.urlSingle.disabled = loading;
    elements.urlsBatch.disabled = loading;

    if (loading) {
        elements.loadingSection.classList.remove('hidden');
        elements.resultsSection.classList.add('hidden');
    } else {
        elements.loadingSection.classList.add('hidden');
    }
}

// 更新批量进度
function updateProgress(current, total, url) {
    const percent = Math.round((current / total) * 100);

    elements.progressText.textContent = `${current} / ${total}`;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressBar.style.width = `${percent}%`;
    elements.currentUrl.textContent = url;
}

// 单条抓取
async function scrapeSingle() {
    const url = elements.urlSingle.value.trim();

    if (!url) {
        showError('请输入 Apple Music 链接');
        return;
    }

    setLoading(true);
    elements.batchProgress.classList.add('hidden');
    elements.loadingText.textContent = '正在抓取...';

    try {
        const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.success) {
            state.results = [data.data];
            displayResults();
        } else {
            showError(data.error || '抓取失败');
        }
    } catch (error) {
        showError('网络错误，请稍后重试');
    } finally {
        setLoading(false);
    }
}

// 批量抓取
async function scrapeBatch() {
    const urls = elements.urlsBatch.value.split('\n').map(u => u.trim()).filter(u => u);

    if (urls.length === 0) {
        showError('请至少输入一个链接');
        return;
    }

    if (urls.length > 50) {
        showError('单次最多支持 50 个链接');
        return;
    }

    setLoading(true);
    elements.batchProgress.classList.remove('hidden');
    elements.loadingText.textContent = '正在批量抓取...';

    state.results = [];

    // 逐个抓取以显示进度
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        updateProgress(i + 1, urls.length, url);

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.success) {
                state.results.push(data.data);
            }
        } catch (error) {
            console.error(`抓取失败: ${url}`, error);
        }

        // 小延迟避免请求过快
        if (i < urls.length - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    setLoading(false);

    if (state.results.length > 0) {
        displayResults(true);
    } else {
        showError('所有链接抓取失败，请检查链接是否正确');
    }
}

// 显示结果
function displayResults(isBatch = false) {
    elements.resultsSection.classList.remove('hidden');
    elements.albumsContainer.innerHTML = '';

    // 批量统计显示
    if (isBatch) {
        elements.batchStats.classList.remove('hidden');
        const successCount = state.results.length;
        const totalCount = elements.urlsBatch.value.split('\n').filter(u => u.trim()).length;
        const failCount = totalCount - successCount;

        elements.statsSuccess.textContent = successCount;
        elements.statsFail.textContent = failCount;
        elements.statsDetail.textContent = `共 ${totalCount} 个链接，成功 ${successCount} 个`;

        elements.jsonBtnText.textContent = `下载全部 JSON (${successCount})`;
        elements.excelBtnText.textContent = `下载全部 Excel (${successCount})`;
    } else {
        elements.batchStats.classList.add('hidden');
        elements.jsonBtnText.textContent = '下载 JSON';
        elements.excelBtnText.textContent = '下载 Excel';
    }

    // 渲染专辑卡片
    state.results.forEach((album, index) => {
        const card = createAlbumCard(album, index);
        elements.albumsContainer.appendChild(card);
    });

    // 滚动到结果区域
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 创建专辑卡片
function createAlbumCard(album, index) {
    const card = document.createElement('div');
    card.className = 'album-card bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in';
    card.style.animationDelay = `${index * 0.1}s`;

    const tracksHtml = album.tracks.map(track => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 px-4 text-center text-gray-400 w-12">${track.index}</td>
            <td class="py-3 px-4">${track.name}</td>
            <td class="py-3 px-4 text-center text-gray-500 w-20">${track.duration}</td>
        </tr>
    `).join('');

    card.innerHTML = `
        <div class="p-6">
            <div class="flex gap-6 mb-6">
                <img src="${album.cover_url}" alt="${album.album_name}"
                     class="w-32 h-32 rounded-xl object-cover shadow-md"
                     onerror="this.src='https://via.placeholder.com/128?text=No+Cover'">
                <div class="flex-1">
                    <h3 class="text-xl font-bold mb-1">${album.album_name}</h3>
                    <p class="text-gray-500 mb-2">${album.artist}</p>
                    <div class="flex items-center gap-4 text-sm text-gray-400">
                        <span>${album.release_date}</span>
                        <span>·</span>
                        <span>${album.track_count} 首歌曲</span>
                    </div>
                </div>
            </div>

            <div class="border-t border-gray-100 pt-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold">歌曲列表</h4>
                    <button class="toggle-tracks text-apple-blue text-sm hover:underline" data-index="${index}">
                        收起
                    </button>
                </div>
                <div class="tracks-container overflow-x-auto" id="tracks-${index}">
                    <table class="w-full text-sm">
                        <tbody>
                            ${tracksHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // 收起/展开功能
    const toggleBtn = card.querySelector('.toggle-tracks');
    const tracksContainer = card.querySelector(`#tracks-${index}`);
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        tracksContainer.style.display = isExpanded ? 'block' : 'none';
        toggleBtn.textContent = isExpanded ? '收起' : '展开';
    });

    return card;
}

// 下载 JSON
async function downloadJson() {
    if (state.results.length === 0) return;

    try {
        const response = await fetch('/api/download/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ albums: state.results })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'albums.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            showError('下载失败');
        }
    } catch (error) {
        showError('下载失败，请稍后重试');
    }
}

// 下载 Excel
async function downloadExcel() {
    if (state.results.length === 0) return;

    try {
        const response = await fetch('/api/download/excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ albums: state.results })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'albums.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            showError('下载失败');
        }
    } catch (error) {
        showError('下载失败，请稍后重试');
    }
}

// 启动
init();
