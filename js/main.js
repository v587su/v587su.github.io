// 数据加载和渲染逻辑

// 加载JSON数据的通用函数
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        return null;
    }
}

// 渲染个人信息
async function renderProfile() {
    const profile = await loadJSON('./data/profile.json');
    if (!profile) {
        console.error('Failed to load profile.json');
        return;
    }

    // 保存到全局变量，供其他函数复用
    profileData = profile;
    myNameGlobal = profile.name;

    // 渲染姓名
    document.getElementById('profile-name').innerHTML = `<b>${profile.name}</b>`;

    // 渲染头像
    const avatarImg = document.getElementById('profile-avatar');
    avatarImg.src = profile.avatar;
    avatarImg.alt = profile.name;

    // 渲染头像说明
    document.getElementById('avatar-caption').textContent = profile.avatarCaption;

    // 渲染联系信息
    document.getElementById('profile-email').innerHTML = `<b>${profile.email}</b>`;
    
    const affiliationDiv = document.getElementById('profile-affiliation');
    affiliationDiv.innerHTML = `
        ${profile.affiliation.school}<br>
        ${profile.affiliation.university}<br>
        ${profile.affiliation.address}<br>
        ${profile.affiliation.city}<br>
    `;

    // 渲染链接
    const linksDiv = document.getElementById('profile-links');
    profile.links.forEach(link => {
        const dd = document.createElement('dd');
        dd.innerHTML = `<a href="${link.url}">${link.name}</a>`;
        linksDiv.appendChild(dd);
    });

    // 渲染介绍
    const introDiv = document.getElementById('introduction-content');
    if (!introDiv) {
        console.error('Introduction content div not found');
        return;
    }
    // 清空容器（防止重复渲染）
    introDiv.innerHTML = '';
    profile.introduction.forEach(paragraph => {
        const p = document.createElement('p');
        p.innerHTML = paragraph;
        introDiv.appendChild(p);
    });
}

// 渲染奖项
async function renderAwards() {
    const awards = await loadJSON('./data/awards.json');
    if (!awards) return;

    const awardsDiv = document.getElementById('awards-list');
    awards.forEach(award => {
        const line = document.createElement('div');
        line.textContent = `${award.year} | ${award.title}`;
        line.style.marginBottom = '5px';
        awardsDiv.appendChild(line);
    });
}

// 渲染学术服务
async function renderServices() {
    const services = await loadJSON('./data/services.json');
    if (!services) return;

    const servicesDiv = document.getElementById('services-list');
    services.forEach(service => {
        const line = document.createElement('div');
        line.innerHTML = `<strong>${service.role}</strong> | ${service.details}`;
        line.style.marginBottom = '5px';
        servicesDiv.appendChild(line);
    });
}

// 渲染标签
function renderTags(tags) {
    return tags.map(tag => {
        if (tag.type === 'separator') {
            return `<span>${tag.text}</span>`;
        }
        return `<span class="tag ${tag.type}">${tag.text}</span>`;
    }).join('\n');
}

// 处理作者列表，添加下划线和标记
function formatAuthors(authorsString, myName, coFirstAuthorIndices = [], correspondingAuthorIndex = null) {
    // 将作者字符串分割成数组
    const authors = authorsString.split(',').map(author => author.trim());
    
    // 处理每个作者
    const formattedAuthors = authors.map((author, index) => {
        let formattedAuthor = author;
        
        // 如果是本人，添加下划线
        if (author === myName) {
            formattedAuthor = `<u>${author}</u>`;
        }
        
        // 如果是共同第一作者，添加图标（使用 sup 标签实现上标）
        if (coFirstAuthorIndices.includes(index)) {
            formattedAuthor += '<sup style="color: #4A90E2; font-size: 0.8em;">👥</sup>';
        }
        
        // 如果是通讯作者，添加图标（使用 sup 标签实现上标）
        if (correspondingAuthorIndex === index) {
            formattedAuthor += '<sup style="color: #E94B3C; font-size: 0.8em;">📧</sup>';
        }
        
        return formattedAuthor;
    });
    
    return formattedAuthors.join(', ');
}

// 渲染单篇论文
function renderPublication(pub, myName) {
    const pubDiv = document.createElement('div');
    pubDiv.style.marginBottom = '20px';
    
    // 格式化作者列表
    const formattedAuthors = formatAuthors(
        pub.authors, 
        myName,
        pub.coFirstAuthorIndices || [],
        pub.correspondingAuthorIndex
    );
    
    // 如果是代表作，添加图标
    const featuredIcon = pub.isFeatured ? '<span style="color: #E74C3C; margin-right: 5px;">📌</span>' : '';
    
    pubDiv.innerHTML = `
        ${featuredIcon}<strong><a href='${pub.url}'>${pub.title}</a></strong><br/>
        ${renderTags(pub.tags)}
        <br/>
        ${formattedAuthors}<br/>
    `;
    
    return pubDiv;
}

// 全局变量保存数据
let allPublications = null;
let myNameGlobal = null;
let profileData = null; // 保存 profile 数据，供其他函数复用
let activeFilters = {
    featured: false,
    cofirst: false,
    corresponding: false,
    year: 'all',
    venue: 'all'
};
let eventListenersAttached = false;

// 更新筛选按钮样式
function updateFilterButtonStyle(buttonId, isActive, activeColor) {
    const btn = document.getElementById(buttonId);
    if (isActive) {
        btn.style.backgroundColor = activeColor;
        btn.style.color = 'white';
        btn.style.borderColor = activeColor;
    } else {
        btn.style.backgroundColor = 'white';
        btn.style.color = '#666';
        btn.style.borderColor = '#ddd';
    }
}

// 重置所有筛选按钮样式
function resetFilterButtonStyles() {
    updateFilterButtonStyle('filter-featured', false, '#E74C3C');
    updateFilterButtonStyle('filter-cofirst', false, '#4A90E2');
    updateFilterButtonStyle('filter-corresponding', false, '#E94B3C');
}

// 筛选并渲染论文
function filterAndRenderPublications() {
    if (!allPublications || !myNameGlobal) return;

    // 筛选论文
    let filtered = allPublications.filter(pub => {
        // 代表作筛选
        if (activeFilters.featured && !pub.isFeatured) return false;
        
        // 第一作者和共同第一作者筛选
        if (activeFilters.cofirst) {
            // 筛选第一作者（isFirstAuthored === true）或共同第一作者（有 coFirstAuthorIndices）
            const isFirstAuthor = pub.isFirstAuthored === true;
            const isCoFirstAuthor = pub.coFirstAuthorIndices && pub.coFirstAuthorIndices.length > 0;
            if (!isFirstAuthor && !isCoFirstAuthor) return false;
        }
        
        // 通讯作者筛选
        if (activeFilters.corresponding && pub.correspondingAuthorIndex === undefined) return false;
        
        // 年份筛选
        if (activeFilters.year !== 'all' && pub.year !== activeFilters.year) return false;
        
        // 会议筛选
        if (activeFilters.venue !== 'all' && pub.venue !== activeFilters.venue) return false;
        
        return true;
    });

    // 分类
    let firstAuthored = filtered.filter(pub => pub.isFirstAuthored === true);
    let coAuthored = filtered.filter(pub => pub.isFirstAuthored === false);

    // 排序（代表作置顶）
    const sortByFeatured = (a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
    };
    firstAuthored.sort(sortByFeatured);
    coAuthored.sort(sortByFeatured);

    // 合并论文列表，第一作者论文在前
    const allPubs = [...firstAuthored, ...coAuthored];

    // 清空并重新渲染
    const publicationsDiv = document.getElementById('publications-list');
    publicationsDiv.innerHTML = '';

    allPubs.forEach(pub => {
        publicationsDiv.appendChild(renderPublication(pub, myNameGlobal));
    });
}

// 渲染出版物
async function renderPublications() {
    const data = await loadJSON('./data/publications.json');
    
    // 复用已加载的 profile 数据，避免重复加载
    // 如果 profile 还没加载完成，等待一下
    if (!profileData) {
        // 等待最多 2 秒让 profile 加载完成
        let waitCount = 0;
        while (!profileData && waitCount < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
        }
    }
    
    // 如果 publications.json 加载失败，显示错误信息
    if (!data) {
        console.error('Failed to load publications.json');
        const publicationsDiv = document.getElementById('publications-list');
        if (publicationsDiv) {
            publicationsDiv.innerHTML = '<p style="color: red;">Failed to load publications. Please check the console for details.</p>';
        }
        return;
    }
    
    // 如果 profile 数据不可用，使用默认值
    if (!profileData) {
        console.warn('Profile data not available, using default name');
        myNameGlobal = 'Author';
    } else {
        myNameGlobal = profileData.name;
    }

    // 保存全局数据
    allPublications = data.publications;

    // 提取所有年份和会议
    const years = [...new Set(data.publications.map(pub => pub.year))].sort((a, b) => b - a);
    const venues = [...new Set(data.publications.map(pub => pub.venue))].sort();

    // 填充年份下拉框
    const yearSelect = document.getElementById('filter-year');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // 填充会议下拉框
    const venueSelect = document.getElementById('filter-venue');
    venues.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue;
        option.textContent = venue;
        venueSelect.appendChild(option);
    });

    // 添加筛选事件监听（只绑定一次）
    if (!eventListenersAttached) {
        document.getElementById('filter-featured').addEventListener('click', function() {
            activeFilters.featured = !activeFilters.featured;
            updateFilterButtonStyle('filter-featured', activeFilters.featured, '#E74C3C');
            filterAndRenderPublications();
        });

        document.getElementById('filter-cofirst').addEventListener('click', function() {
            // 如果当前是激活状态，则取消；如果是未激活状态，则激活并取消 corresponding
            if (activeFilters.cofirst) {
                activeFilters.cofirst = false;
            } else {
                activeFilters.cofirst = true;
                // 互斥：取消 corresponding
                if (activeFilters.corresponding) {
                    activeFilters.corresponding = false;
                    updateFilterButtonStyle('filter-corresponding', false, '#E94B3C');
                }
            }
            updateFilterButtonStyle('filter-cofirst', activeFilters.cofirst, '#4A90E2');
            filterAndRenderPublications();
        });

        document.getElementById('filter-corresponding').addEventListener('click', function() {
            // 如果当前是激活状态，则取消；如果是未激活状态，则激活并取消 cofirst
            if (activeFilters.corresponding) {
                activeFilters.corresponding = false;
            } else {
                activeFilters.corresponding = true;
                // 互斥：取消 cofirst
                if (activeFilters.cofirst) {
                    activeFilters.cofirst = false;
                    updateFilterButtonStyle('filter-cofirst', false, '#4A90E2');
                }
            }
            updateFilterButtonStyle('filter-corresponding', activeFilters.corresponding, '#E94B3C');
            filterAndRenderPublications();
        });

        yearSelect.addEventListener('change', function() {
            activeFilters.year = this.value;
            filterAndRenderPublications();
        });

        venueSelect.addEventListener('change', function() {
            activeFilters.venue = this.value;
            filterAndRenderPublications();
        });

        document.getElementById('reset-filters').addEventListener('click', function() {
            activeFilters = {
                featured: false,
                cofirst: false,
                corresponding: false,
                year: 'all',
                venue: 'all'
            };
            
            resetFilterButtonStyles();
            yearSelect.value = 'all';
            venueSelect.value = 'all';
            filterAndRenderPublications();
        });
        
        eventListenersAttached = true;
    }

    // 初始渲染
    filterAndRenderPublications();
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    // 并行加载所有数据并渲染
    await Promise.all([
        renderProfile(),
        renderAwards(),
        renderServices(),
        renderPublications()
    ]);
    
    // 获取并显示最后修改时间
    try {
        const response = await fetch('./index.html', { method: 'HEAD' });
        if (response.ok) {
            const lastModifiedHeader = response.headers.get('Last-Modified');
            if (lastModifiedHeader) {
                const lastModified = new Date(lastModifiedHeader).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                document.getElementById('last-modified').textContent = `Last modified: ${lastModified}`;
            } else {
                // 如果服务器不支持 Last-Modified 头，尝试从主数据文件获取
                const profileResponse = await fetch('./data/profile.json', { method: 'HEAD' });
                if (profileResponse.ok) {
                    const profileLastModified = profileResponse.headers.get('Last-Modified');
                    if (profileLastModified) {
                        const lastModified = new Date(profileLastModified).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        });
                        document.getElementById('last-modified').textContent = `Last modified: ${lastModified}`;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching last modified time:', error);
        // 如果获取失败，不显示修改时间
    }
});

