// ==================== DATA AWAL ====================
const DEFAULT_DATA = {
    "skrining": {
        name: "🩺 Skrining Kesehatan",
        description: "Informasi tentang berbagai jenis skrining kesehatan",
        type: "category",
        children: {
            "skrining_diabetes": {
                name: "🔬 Skrining Diabetes",
                description: "Informasi skrining gula darah dan diabetes",
                faqs: [
                    { question: "Apa itu skrining diabetes?", answer: "Skrining diabetes adalah pemeriksaan untuk mendeteksi kadar gula darah dan risiko diabetes." },
                    { question: "Berapa biaya skrining diabetes?", answer: "Biaya mulai dari Rp 50.000 - Rp 150.000 tergantung paket." }
                ]
            },
            "skrining_jantung": {
                name: "❤️ Skrining Jantung",
                description: "Informasi skrining kesehatan jantung",
                faqs: [
                    { question: "Apa saja yang diperiksa dalam skrining jantung?", answer: "EKG, tekanan darah, kolesterol, dan riwayat kesehatan." },
                    { question: "Siapa yang perlu skrining jantung?", answer: "Usia 40+, memiliki riwayat keluarga dengan penyakit jantung." }
                ]
            }
        },
        faqs: [
            { question: "Apa itu skrining kesehatan?", answer: "Skrining kesehatan adalah pemeriksaan dini untuk mendeteksi penyakit sebelum gejala muncul." },
            { question: "Seberapa sering perlu skrining?", answer: "Tergantung usia dan faktor risiko. Konsultasikan dengan dokter Anda." }
        ]
    },
    "akun": {
        name: "🔐 Akun & Keamanan",
        description: "Informasi login, 2FA, dan keamanan data",
        type: "category",
        faqs: [
            { question: "Lupa password?", answer: "Klik 'Lupa password', tautan reset akan dikirim ke email." },
            { question: "Apakah data aman?", answer: "Ya, enkripsi end-to-end dan sertifikasi ISO 27001." }
        ]
    },
    "pembayaran": {
        name: "💳 Pembayaran",
        description: "Metode pembayaran, invoice, dan refund",
        type: "category",
        faqs: [
            { question: "Metode pembayaran apa saja?", answer: "Kartu kredit, PayPal, transfer bank, QRIS." },
            { question: "Kebijakan refund?", answer: "Garansi 30 hari uang kembali." }
        ]
    }
};

let faqData = JSON.parse(JSON.stringify(DEFAULT_DATA));
let categoryCounter = Object.keys(faqData).length;

// ==================== UTILITY FUNCTIONS ====================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return map[m];
    });
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function getNestedObject(obj, path) {
    if (!path) return null;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (!current) return null;
        if (current[key] !== undefined) {
            current = current[key];
        } else if (current.children && current.children[key] !== undefined) {
            current = current.children[key];
        } else {
            return null;
        }
    }
    return current;
}

function deleteNestedObject(obj, path) {
    const keys = path.split('.');
    if (keys.length === 1) {
        delete obj[keys[0]];
        return;
    }
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key]) {
            current = current[key];
        } else if (current.children && current.children[key]) {
            current = current.children[key];
        } else {
            return;
        }
    }
    const lastKey = keys[keys.length - 1];
    if (current[lastKey] !== undefined) {
        delete current[lastKey];
    } else if (current.children && current.children[lastKey] !== undefined) {
        delete current.children[lastKey];
    }
}

function getFlattenFaqs(data) {
    const result = {};
    function traverse(obj, prefix) {
        for (const key in obj) {
            const item = obj[key];
            const fullKey = prefix ? prefix + '.' + key : key;
            if (item.faqs && item.faqs.length > 0) {
                result[fullKey] = {
                    name: item.name,
                    description: item.description || '',
                    faqs: item.faqs || []
                };
            }
            if (item.children) {
                traverse(item.children, fullKey);
            }
        }
    }
    traverse(data, '');
    return result;
}

// ==================== LOCAL STORAGE ====================
function saveToLocalStorage() {
    try {
        localStorage.setItem('faqGeneratorData', JSON.stringify(faqData));
        localStorage.setItem('faqGeneratorCounter', categoryCounter.toString());
    } catch (e) {
        console.error('Gagal menyimpan ke LocalStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('faqGeneratorData');
        const savedCounter = localStorage.getItem('faqGeneratorCounter');
        if (saved) {
            faqData = JSON.parse(saved);
            if (savedCounter) categoryCounter = parseInt(savedCounter);
            return true;
        }
    } catch (e) {
        console.error('Gagal memuat dari LocalStorage:', e);
    }
    return false;
}

// ==================== IMPORT / EXPORT ====================
function exportJSON() {
    const dataStr = JSON.stringify(faqData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faq-data-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Data berhasil di-export!');
}

function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (typeof imported !== 'object' || imported === null) {
                throw new Error('Format tidak valid');
            }
            if (confirm('Import akan menimpa data saat ini. Lanjutkan?')) {
                faqData = imported;
                categoryCounter = Object.keys(faqData).length;
                renderEditor();
                updatePreview();
                saveToLocalStorage();
                showToast('📤 Data berhasil di-import!');
            }
        } catch (err) {
            showToast('❌ File JSON tidak valid!', true);
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (confirm('⚠️ Semua data akan dihapus dan dikembalikan ke default. Lanjutkan?')) {
        faqData = JSON.parse(JSON.stringify(DEFAULT_DATA));
        categoryCounter = Object.keys(faqData).length;
        renderEditor();
        updatePreview();
        saveToLocalStorage();
        showToast('🔄 Data direset ke default!');
    }
}

// ==================== RENDER EDITOR ====================
function renderEditor() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    container.innerHTML = '';
    renderCategoryTree(container, faqData, '', 0);
}

function renderCategoryTree(container, data, parentPath, level) {
    for (const key in data) {
        const item = data[key];
        const currentPath = parentPath ? parentPath + '.' + key : key;

        const catDiv = document.createElement('div');
        catDiv.className = 'category-item';
        catDiv.setAttribute('data-cat-key', currentPath);

        const indent = level * 20;
        catDiv.style.marginLeft = indent + 'px';
        catDiv.style.borderLeft = (level > 0) ? '3px solid #8b5cf6' : '3px solid #667eea';

        catDiv.innerHTML = `
            <div class="category-header-input">
                <div style="display:flex; align-items:center; gap:8px; flex:1;">
                    ${level > 0 ? '<span style="font-size:0.8rem; color:#8b5cf6;">└─ </span>' : ''}
                    <input type="text" class="category-name-input" value="${escapeHtml(item.name)}" placeholder="Nama kategori" data-path="${currentPath}" data-field="name" style="${level > 0 ? 'font-size:0.9rem;' : ''}">
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-secondary btn-sm add-subcategory" data-path="${currentPath}" title="Tambah sub kategori">📁 Sub</button>
                    <button class="btn btn-danger btn-sm delete-category" data-path="${currentPath}">🗑</button>
                </div>
            </div>
            <input type="text" class="category-desc-input" value="${escapeHtml(item.description || '')}" placeholder="Deskripsi kategori" data-path="${currentPath}" data-field="description" style="margin-bottom:0.8rem;">
            
            <div style="margin: 0.5rem 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                    <span style="font-weight:600; font-size:0.85rem; color:#64748b;">📝 Pertanyaan</span>
                    <button class="btn btn-secondary btn-sm add-faq" data-path="${currentPath}">+ Tambah FAQ</button>
                </div>
                <div class="faqs-container" data-path="${currentPath}"></div>
            </div>
            
            <div style="margin: 0.5rem 0 0 1rem; padding-left: 0.5rem; border-left: 2px dashed #dee2e6;">
                <div class="subcategories-container" data-path="${currentPath}"></div>
            </div>
        `;

        container.appendChild(catDiv);

        // Render FAQs
        const faqsContainer = catDiv.querySelector('.faqs-container');
        if (item.faqs) {
            for (let i = 0; i < item.faqs.length; i++) {
                const faq = item.faqs[i];
                const faqDiv = document.createElement('div');
                faqDiv.className = 'faq-item';
                faqDiv.innerHTML = `
                    <input type="text" class="faq-question-input" value="${escapeHtml(faq.question)}" placeholder="Pertanyaan" data-path="${currentPath}" data-faq-idx="${i}" data-field="question" style="margin-bottom:0.5rem;">
                    <textarea rows="2" class="faq-answer-input" placeholder="Jawaban" data-path="${currentPath}" data-faq-idx="${i}" data-field="answer">${escapeHtml(faq.answer)}</textarea>
                    <button class="btn btn-danger btn-sm delete-faq" data-path="${currentPath}" data-faq-idx="${i}" style="margin-top:0.5rem;">Hapus FAQ</button>
                `;
                faqsContainer.appendChild(faqDiv);
            }
        }

        // Render Sub Categories (rekursif)
        const subContainer = catDiv.querySelector('.subcategories-container');
        if (item.children) {
            renderCategoryTree(subContainer, item.children, currentPath, level + 1);
        }
    }
}

// ==================== EVENT DELEGATION (Performa Tinggi) ====================
function setupEventDelegation() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    // Handle input changes
    container.addEventListener('input', (e) => {
        const target = e.target;
        const path = target.getAttribute('data-path');
        if (!path) return;

        if (target.classList.contains('category-name-input') || target.classList.contains('category-desc-input')) {
            const field = target.getAttribute('data-field');
            const obj = getNestedObject(faqData, path);
            if (obj) {
                obj[field] = target.value;
                updatePreview();
            }
        }
        else if (target.classList.contains('faq-question-input') || target.classList.contains('faq-answer-input')) {
            const faqIdx = parseInt(target.getAttribute('data-faq-idx'));
            const field = target.getAttribute('data-field');
            const obj = getNestedObject(faqData, path);
            if (obj && obj.faqs && obj.faqs[faqIdx]) {
                obj.faqs[faqIdx][field] = target.value;
                updatePreview();
            }
        }
    });

    // Handle clicks
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const path = btn.getAttribute('data-path');
        if (!path) return;

        if (btn.classList.contains('delete-category')) {
            if (confirm('Hapus kategori "' + path + '" dan semua isinya?')) {
                deleteNestedObject(faqData, path);
                renderEditor();
                updatePreview();
                showToast('🗑 Kategori dihapus!');
            }
        }
        else if (btn.classList.contains('add-faq')) {
            const obj = getNestedObject(faqData, path);
            if (obj) {
                if (!obj.faqs) obj.faqs = [];
                obj.faqs.push({
                    question: "Pertanyaan baru",
                    answer: "Jawaban untuk pertanyaan ini"
                });
                renderEditor();
                updatePreview();
                showToast('✅ FAQ ditambahkan!');
            }
        }
        else if (btn.classList.contains('delete-faq')) {
            const faqIdx = parseInt(btn.getAttribute('data-faq-idx'));
            const obj = getNestedObject(faqData, path);
            if (obj && obj.faqs) {
                obj.faqs.splice(faqIdx, 1);
                renderEditor();
                updatePreview();
                showToast('🗑 FAQ dihapus!');
            }
        }
        else if (btn.classList.contains('add-subcategory')) {
            const obj = getNestedObject(faqData, path);
            if (obj) {
                if (!obj.children) obj.children = {};
                const newKey = 'sub_' + Date.now();
                obj.children[newKey] = {
                    name: '📌 Sub Kategori Baru',
                    description: 'Deskripsi sub kategori',
                    faqs: [
                        { question: 'Contoh pertanyaan sub?', answer: 'Contoh jawaban sub.' }
                    ]
                };
                renderEditor();
                updatePreview();
                showToast('✅ Sub kategori ditambahkan!');
            }
        }
    });
}

// ==================== SHARED CSS ====================
function getSharedCSS() {
    return `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
    padding: 1rem;
    min-height: 100vh;
}
.faq-container {
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    border-radius: 2rem;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    overflow: hidden;
    position: relative;
}
.faq-wrapper { display: flex; }
.faq-menu {
    flex: 1.2;
    min-width: 280px;
    max-width: 340px;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    padding: 2rem 1.2rem;
    transition: all 0.3s ease;
    overflow-y: auto;
    max-height: 90vh;
    -webkit-overflow-scrolling: touch;
}
.faq-content {
    flex: 3;
    background: #fefefe;
    padding: 2rem;
}
.hamburger-btn { display: none; }
.menu-overlay { display: none; }
.menu-title {
    font-size: 1.6rem;
    font-weight: 700;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    margin-bottom: 0.3rem;
}
.menu-sub {
    font-size: 0.85rem;
    color: #64748b;
    border-bottom: 2px solid #eef2ff;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
}
.menu-list { display: flex; flex-direction: column; gap: 0.35rem; }
.menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0.75rem 1rem;
    border-radius: 0.8rem;
    cursor: pointer;
    font-weight: 500;
    color: #334155;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    font-size: 0.95rem;
    transition: all 0.2s;
    font-family: inherit;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.menu-item:hover { background: #f1f5f9; }
.menu-item.active {
    background: linear-gradient(95deg, #eff6ff, #ffffff);
    color: #2563eb;
    border-left: 4px solid #3b82f6;
    font-weight: 600;
}
.menu-item .menu-label { flex: 1; }
.toggle-icon {
    font-size: 0.65rem;
    color: #94a3b8;
    transition: transform 0.25s ease;
    width: 1rem;
    text-align: center;
    flex-shrink: 0;
}
.menu-item.expanded .toggle-icon {
    transform: rotate(90deg);
    color: #3b82f6;
}
.children-container {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.35s ease;
    margin-left: 0.5rem;
    border-left: 2px solid #e2e8f0;
    padding-left: 0.3rem;
}
.children-container.expanded {
    max-height: 2000px;
}
.menu-item.indent-1 { padding-left: 1.8rem; font-size: 0.9rem; }
.menu-item.indent-2 { padding-left: 2.8rem; font-size: 0.88rem; }
.menu-item.indent-3 { padding-left: 3.8rem; font-size: 0.86rem; }
.category-header {
    margin-bottom: 2rem;
    border-left: 5px solid #3b82f6;
    padding-left: 1rem;
}
.category-header h2 { font-size: 1.8rem; color: #0f172a; }
.category-header p { color: #475569; margin-top: 0.3rem; }
.accordion { display: flex; flex-direction: column; gap: 1rem; }
.accordion-item {
    background: white;
    border-radius: 1.2rem;
    border: 1px solid #e2e8f0;
    overflow: hidden;
}
.accordion-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.2rem 1.6rem;
    cursor: pointer;
    font-weight: 600;
    color: #1e293b;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
.accordion-icon {
    font-size: 1.6rem;
    color: #64748b;
    transition: transform 0.3s;
}
.accordion-item.active .accordion-icon { transform: rotate(45deg); color: #3b82f6; }
.accordion-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;
}
.accordion-item.active .accordion-answer {
    max-height: 500px;
    border-top: 1px solid #eef2ff;
}
.answer-inner { padding: 1.2rem 1.6rem; color: #334155; line-height: 1.6; }
.empty-state {
    padding: 2rem;
    text-align: center;
    color: #94a3b8;
}
@media (max-width: 768px) {
    body { padding: 0.5rem; }
    .faq-wrapper { position: relative; }
    .faq-menu {
        position: fixed;
        top: 0;
        left: -300px;
        width: 280px;
        height: 100vh;
        height: 100dvh;
        max-height: 100vh;
        max-height: 100dvh;
        z-index: 1000;
        background: white;
        box-shadow: 2px 0 20px rgba(0,0,0,0.15);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        transition: left 0.3s ease;
        border-right: none;
        padding: 1.5rem 1rem;
    }
    .faq-menu.menu-open { left: 0; }
    .menu-overlay {
        display: block;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    .menu-overlay.active { opacity: 1; visibility: visible; }
    .hamburger-btn {
        display: inline-flex;
        background: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.6rem 1rem;
        border-radius: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #1e293b;
        touch-action: manipulation;
    }
    .faq-content { padding: 1rem; }
    .category-header h2 { font-size: 1.4rem; }
    .accordion-question { padding: 1rem; font-size: 0.95rem; }
    .answer-inner { padding: 1rem; font-size: 0.9rem; }
}`;
}

// ==================== SHARED SCRIPT ====================
function getSharedScript() {
    return `
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return map[m];
    });
}

function renderMenu() {
    const menuList = document.getElementById('menuList');
    if (!menuList) return;
    menuList.innerHTML = '';

    const groups = {};
    const order = [];
    for (const key in faqData) {
        const parts = key.split('.');
        const level = parts.length - 1;
        const parentKey = parts.slice(0, -1).join('.');

        if (level === 0) {
            groups[key] = { data: faqData[key], children: [] };
            order.push(key);
        } else {
            if (!groups[parentKey]) groups[parentKey] = { data: null, children: [] };
            groups[parentKey].children.push({ key, data: faqData[key], level });
        }
    }

    for (const parentKey of order) {
        const group = groups[parentKey];
        const hasChildren = group.children.length > 0;

        const parentBtn = document.createElement('button');
        parentBtn.className = 'menu-item' + (hasChildren ? ' has-children' : '');
        parentBtn.setAttribute('data-key', parentKey);
        if (hasChildren) {
            parentBtn.innerHTML = '<span class="toggle-icon">▶</span><span class="menu-label">' + escapeHtml(group.data.name) + '</span>';
        } else {
            parentBtn.innerHTML = '<span class="menu-label">' + escapeHtml(group.data.name) + '</span>';
        }
        menuList.appendChild(parentBtn);

        if (hasChildren) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';
            childrenContainer.setAttribute('data-parent', parentKey);

            for (const child of group.children) {
                const childBtn = document.createElement('button');
                childBtn.className = 'menu-item indent-' + Math.min(child.level, 3);
                childBtn.setAttribute('data-key', child.key);
                childBtn.innerHTML = '<span class="menu-label">' + escapeHtml(child.data.name) + '</span>';
                childrenContainer.appendChild(childBtn);
            }
            menuList.appendChild(childrenContainer);
        }
    }

    menuList.querySelectorAll('.menu-item.has-children').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = btn.getAttribute('data-key');
            const container = menuList.querySelector('.children-container[data-parent="' + key + '"]');

            if (e.target.classList.contains('toggle-icon')) {
                e.stopPropagation();
                if (container) {
                    container.classList.toggle('expanded');
                    btn.classList.toggle('expanded');
                }
                return;
            }

            if (container && !container.classList.contains('expanded')) {
                container.classList.add('expanded');
                btn.classList.add('expanded');
            }
            selectCategory(key);
        });
    });

    menuList.querySelectorAll('.menu-item:not(.has-children)').forEach(btn => {
        btn.addEventListener('click', () => {
            selectCategory(btn.getAttribute('data-key'));
        });
    });

    if (activeCategory) {
        setActiveMenuItem(activeCategory);
        const parts = activeCategory.split('.');
        if (parts.length > 1) {
            const parentKey = parts.slice(0, -1).join('.');
            const parentBtn = menuList.querySelector('.menu-item[data-key="' + parentKey + '"]');
            const container = menuList.querySelector('.children-container[data-parent="' + parentKey + '"]');
            if (parentBtn && container) {
                parentBtn.classList.add('expanded');
                container.classList.add('expanded');
            }
        }
    }
}

function selectCategory(key) {
    activeCategory = key;
    setActiveMenuItem(key);
    renderAccordion(key);
    closeMenuMobile();
}

function setActiveMenuItem(key) {
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-key') === key);
    });
}

function renderAccordion(categoryKey) {
    const cat = faqData[categoryKey];
    if (!cat) return;
    document.getElementById('catTitle').innerText = cat.name;
    document.getElementById('catDesc').innerText = cat.description || '';
    const container = document.getElementById('accordionContainer');
    container.innerHTML = '';
    if (!cat.faqs || cat.faqs.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada pertanyaan di kategori ini.</div>';
        return;
    }
    for (const faq of cat.faqs) {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.innerHTML =
            '<div class="accordion-question">' +
                '<span>' + escapeHtml(faq.question) + '</span>' +
                '<span class="accordion-icon">+</span>' +
            '</div>' +
            '<div class="accordion-answer">' +
                '<div class="answer-inner">' + escapeHtml(faq.answer) + '</div>' +
            '</div>';
        item.querySelector('.accordion-question').onclick = () => item.classList.toggle('active');
        container.appendChild(item);
    }
}

function openMenuMobile() {
    document.getElementById('faqMenu')?.classList.add('menu-open');
    document.getElementById('menuOverlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenuMobile() {
    document.getElementById('faqMenu')?.classList.remove('menu-open');
    document.getElementById('menuOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('hamburgerBtn')?.addEventListener('click', openMenuMobile);
document.getElementById('menuOverlay')?.addEventListener('click', closeMenuMobile);
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) closeMenuMobile();
});

const keys = Object.keys(faqData);
if (keys.length > 0) activeCategory = keys[0];
renderMenu();
renderAccordion(activeCategory);`;
}

// ==================== GENERATE HTML ====================
function generateHTML() {
    const flatData = getFlattenFaqs(faqData);
    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
<title>FAQ Center</title>
<style>${getSharedCSS()}</style>
</head>
<body>
<div class="faq-container">
    <div class="menu-overlay" id="menuOverlay"></div>
    <div class="faq-wrapper">
        <div class="faq-menu" id="faqMenu">
            <div class="menu-title">📘 FAQ Center</div>
            <div class="menu-sub">Klik ▶ untuk expand sub-kategori</div>
            <div class="menu-list" id="menuList"></div>
        </div>
        <div class="faq-content">
            <button class="hamburger-btn" id="hamburgerBtn">☰ Menu</button>
            <div class="category-header">
                <h2 id="catTitle"></h2>
                <p id="catDesc"></p>
            </div>
            <div id="accordionContainer" class="accordion"></div>
        </div>
    </div>
</div>
<script>
const faqData = ${JSON.stringify(flatData, null, 2)};
let activeCategory = Object.keys(faqData)[0] || '';
${getSharedScript()}
<\/script>
</body>
</html>`;
}

// ==================== GENERATE USERSCRIPT (MOBILE-FRIENDLY) ====================
function generateUserScript() {
    const flatData = getFlattenFaqs(faqData);
    const faqDataStr = JSON.stringify(flatData, null, 2);
    
    const userscriptExtraCSS = `
    body.faq-userscript-active { 
        overflow: hidden !important; 
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
    }
    .faq-fullscreen {
        position: fixed;
        top: 0; left: 0;
        width: 100%; 
        height: 100vh;
        height: 100dvh;
        max-height: 100vh;
        max-height: 100dvh;
        background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
        z-index: 999999;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
    }
    .faq-container {
        max-width: 1400px;
        margin: 1rem auto;
        min-height: calc(100vh - 2rem);
        min-height: calc(100dvh - 2rem);
    }
    .back-to-site {
        position: fixed;
        bottom: 20px; left: 20px;
        background: rgba(255,255,255,0.95);
        border: 1px solid #e2e8f0;
        padding: 0.6rem 1.2rem;
        border-radius: 2rem;
        cursor: pointer;
        font-size: 0.85rem;
        color: #64748b;
        z-index: 1000000;
        font-family: inherit;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }
    .back-to-site:hover { background: white; color: #3b82f6; }
    @media (max-width: 768px) {
        .faq-fullscreen { padding: 0; }
        .faq-container {
            margin: 0;
            border-radius: 0;
            min-height: 100vh;
            min-height: 100dvh;
            box-shadow: none;
        }
        .faq-menu {
            width: 85vw !important;
            max-width: 300px !important;
            left: -85vw !important;
        }
        .faq-menu.menu-open { left: 0 !important; }
        .faq-content { padding: 0.8rem !important; }
        .category-header { margin-bottom: 1rem; padding-left: 0.8rem; }
        .category-header h2 { font-size: 1.3rem !important; }
        .accordion { gap: 0.7rem; }
        .accordion-item { border-radius: 0.8rem; }
        .accordion-question { padding: 0.9rem 1rem !important; font-size: 0.9rem !important; }
        .answer-inner { padding: 0.9rem 1rem !important; font-size: 0.85rem !important; }
        .hamburger-btn { padding: 0.5rem 0.9rem !important; font-size: 1.2rem !important; }
        .back-to-site { bottom: 12px; left: 12px; padding: 0.5rem 1rem; font-size: 0.75rem; }
        .menu-title { font-size: 1.3rem; }
        .menu-item { padding: 0.7rem 0.9rem; font-size: 0.9rem; }
    }
    @media (max-width: 380px) {
        .category-header h2 { font-size: 1.15rem !important; }
        .accordion-question { padding: 0.8rem !important; font-size: 0.85rem !important; }
        .answer-inner { padding: 0.8rem !important; font-size: 0.82rem !important; }
    }
    `;
    
    return `// ==UserScript==
// @name         FAQ Center - Custom
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  FAQ 2 Kolom dengan Accordion & Nested Categories (Mobile-Friendly)
// @author       FAQ Generator
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function() {
'use strict';

let viewportMeta = document.querySelector('meta[name="viewport"]');
if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
}
viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';

const faqData = ${faqDataStr};

const style = document.createElement('style');
style.textContent = \`${getSharedCSS().replace(/`/g, '\\`')}${userscriptExtraCSS}\`;
document.head.appendChild(style);

document.body.classList.add('faq-userscript-active');
const scrollY = window.scrollY;
document.body.style.top = '-' + scrollY + 'px';

const fullscreenDiv = document.createElement('div');
fullscreenDiv.className = 'faq-fullscreen';
fullscreenDiv.innerHTML = \`
    <div class="faq-container">
        <div class="menu-overlay" id="menuOverlay"></div>
        <div class="faq-wrapper">
            <div class="faq-menu" id="faqMenu">
                <div class="menu-title">📘 FAQ Center</div>
                <div class="menu-sub">Klik ▶ untuk expand sub-kategori</div>
                <div class="menu-list" id="menuList"></div>
            </div>
            <div class="faq-content">
                <button class="hamburger-btn" id="hamburgerBtn">☰ Menu</button>
                <div class="category-header">
                    <h2 id="catTitle"></h2>
                    <p id="catDesc"></p>
                </div>
                <div id="accordionContainer" class="accordion"></div>
            </div>
        </div>
    </div>
    <button class="back-to-site" id="backToSiteBtn">← Kembali ke Situs</button>
\`;

document.body.appendChild(fullscreenDiv);

let activeCategory = Object.keys(faqData)[0] || '';
${getSharedScript().replace(/`/g, '\\`')}

document.getElementById('backToSiteBtn').onclick = () => {
    document.body.classList.remove('faq-userscript-active');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
    fullscreenDiv.remove();
    style.remove();
};
})();`;
}

// ==================== GENERATE JSON OUTPUT ====================
function getJsonOutput() {
    return JSON.stringify(faqData, null, 2);
}

// ==================== UPDATE PREVIEW ====================
let saveTimeout;
function updatePreview() {
    const html = generateHTML();
    const iframe = document.getElementById('previewFrame');
    if (iframe) iframe.srcdoc = html;

    const htmlOutput = document.getElementById('htmlOutput');
    const userscriptOutput = document.getElementById('userscriptOutput');
    const jsonOutput = document.getElementById('jsonOutput');
    
    if (htmlOutput) htmlOutput.textContent = html;
    if (userscriptOutput) userscriptOutput.textContent = generateUserScript();
    if (jsonOutput) jsonOutput.textContent = getJsonOutput();

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveToLocalStorage();
    }, 500);
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('FAQ Generator v3.0 (4 Tabs + Mobile-Friendly) started!');

    // Load saved data
    const loaded = loadFromLocalStorage();
    if (loaded) {
        console.log('✅ Data dimuat dari LocalStorage');
    }

    renderEditor();
    setupEventDelegation();
    updatePreview();

    // Add category button
    const addBtn = document.getElementById('addCategoryBtn');
    if (addBtn) {
        addBtn.onclick = () => {
            const newKey = 'kategori_' + (++categoryCounter);
            faqData[newKey] = {
                name: '📂 Kategori Baru',
                description: 'Deskripsi kategori',
                faqs: [
                    { question: 'Contoh pertanyaan?', answer: 'Contoh jawaban.' }
                ]
            };
            renderEditor();
            updatePreview();
            showToast('✅ Kategori ditambahkan!');
        };
    }

    // Generate button
    const genBtn = document.getElementById('generateBtn');
    if (genBtn) {
        genBtn.onclick = () => {
            updatePreview();
            showToast('✅ Preview diperbarui!');
        };
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.onclick = exportJSON;
    }

    // Import button
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    if (importBtn && importFile) {
        importBtn.onclick = () => importFile.click();
        importFile.onchange = (e) => {
            if (e.target.files[0]) {
                importJSON(e.target.files[0]);
                e.target.value = '';
            }
        };
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.onclick = resetData;
    }

    // Copy buttons (HTML & UserScript)
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = () => {
            const type = btn.getAttribute('data-type');
            const text = document.getElementById(type === 'html' ? 'htmlOutput' : 'userscriptOutput')?.textContent || '';
            navigator.clipboard.writeText(text).then(() => {
                showToast('📋 ' + (type === 'html' ? 'HTML' : 'UserScript') + ' berhasil disalin!');
            }).catch(() => {
                showToast('❌ Gagal menyalin!', true);
            });
        };
    });

    // Copy JSON button
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    if (copyJsonBtn) {
        copyJsonBtn.onclick = () => {
            const text = document.getElementById('jsonOutput')?.textContent || '';
            navigator.clipboard.writeText(text).then(() => {
                showToast('📋 JSON berhasil disalin!');
            }).catch(() => {
                showToast('❌ Gagal menyalin!', true);
            });
        };
    }

    // Download JSON button (di tab JSON)
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    if (downloadJsonBtn) {
        downloadJsonBtn.onclick = exportJSON;
    }

    // Tab switching (4 tabs)
    document.querySelectorAll('.output-tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.output-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.output-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabId = btn.getAttribute('data-tab');
            const targetTab = document.getElementById(tabId + 'Tab');
            if (targetTab) targetTab.classList.add('active');
        };
    });
});
