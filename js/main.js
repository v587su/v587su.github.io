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
    if (!profile) return;

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

// 渲染单篇论文
function renderPublication(pub) {
    const pubDiv = document.createElement('div');
    pubDiv.style.marginBottom = '20px';
    
    pubDiv.innerHTML = `
        <strong><a href='${pub.url}'>${pub.title}</a></strong><br/>
        ${renderTags(pub.tags)}
        <br/>
        ${pub.authors}<br/>
    `;
    
    return pubDiv;
}

// 渲染出版物
async function renderPublications() {
    const publications = await loadJSON('./data/publications.json');
    if (!publications) return;

    // 渲染第一作者/监督的论文
    const firstAuthoredDiv = document.getElementById('first-authored-publications');
    publications.firstAuthored.forEach(pub => {
        firstAuthoredDiv.appendChild(renderPublication(pub));
    });

    // 渲染合作论文
    const coAuthoredDiv = document.getElementById('co-authored-publications');
    publications.coAuthored.forEach(pub => {
        coAuthoredDiv.appendChild(renderPublication(pub));
    });
}

// 渲染经历
async function renderExperiences() {
    const experiences = await loadJSON('./data/experiences.json');
    if (!experiences) return;

    const experiencesDiv = document.getElementById('experiences-list');
    experiences.forEach(exp => {
        const expBlock = document.createElement('div');
        expBlock.style.marginBottom = '15px';
        expBlock.innerHTML = `
            <strong>${exp.title}</strong><br />
            <p>
                ${exp.institution} <br />
                ${exp.location}<br />
                ${exp.period} <br />
            </p>
        `;
        experiencesDiv.appendChild(expBlock);
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    // 并行加载所有数据并渲染
    await Promise.all([
        renderProfile(),
        renderAwards(),
        renderServices(),
        renderPublications(),
        renderExperiences()
    ]);
    
    // 添加最后修改时间
    const lastModified = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    document.getElementById('last-modified').textContent = `Last modified: ${lastModified}`;
});

