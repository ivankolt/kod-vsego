import { supabase } from './supabase.js';

// Элементы интерфейса
const loginBlock = document.getElementById('login-block');
const dashboard = document.getElementById('admin-dashboard');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

// Формы
const addProductForm = document.getElementById('add-product-form');
const addProjectForm = document.getElementById('add-project-form');
const settingsForm = document.getElementById('settings-form');

// --- 1. ИНИЦИАЛИЗАЦИЯ И ПРОВЕРКА СЕССИИ ---

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showDashboard();
    }
}

function showDashboard() {
    loginBlock.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadAllData();
}

// --- 2. АВТОРИЗАЦИЯ (ВХОД / ВЫХОД) ---

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Ошибка входа: " + error.message);
    } else {
        showDashboard();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
});

// --- 3. ЗАГРУЗКА ДАННЫХ ---

async function loadAllData() {
    await Promise.all([
        loadOffers(),
        loadProducts(),
        loadProjects(),
        loadSettings()
    ]);
}

// Загрузка предложений (сортировка: сначала новые)
// Исправленная функция загрузки предложений
async function loadOffers() {
    const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    const container = document.getElementById('offers-container');
    if (error) return console.error(error);

    // УДАЛЯЕМ fade-in и animate-in, чтобы карточки были видны сразу
    container.innerHTML = data.map(o => `
        <div class="bg-[#1c212e] p-6 rounded-2xl border border-gray-800 flex justify-between items-center shadow-lg">
            <div>
                <h4 class="font-bold text-lg text-white">${o.first_name} ${o.last_name}</h4>
                <p class="text-gray-400 text-sm">${o.email} | ${o.phone || 'Телефон не указан'}</p>
                <p class="mt-2 text-brand-blue font-medium">"${o.message}"</p>
                <p class="text-[10px] text-gray-500 mt-2">${new Date(o.created_at).toLocaleString()}</p>
            </div>
            <button onclick="deleteItem('contact_submissions', '${o.id}')" class="text-red-500 p-3 hover:bg-red-500/10 rounded-xl transition-all font-bold">
                Удалить
            </button>
        </div>
    `).join('') || '<p class="text-gray-500 text-center py-10">Предложений пока нет</p>';
}

// Загрузка товаров
async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('products-admin-list');
    if (error) return;

    container.innerHTML = data.map(p => `
        <div class="bg-[#1c212e] p-4 rounded-2xl border border-gray-800 flex flex-col">
            <img src="${p.image_main}" class="h-40 w-full object-cover rounded-xl mb-4 border border-gray-700">
            <h4 class="font-bold truncate">${p.title}</h4>
            <p class="text-brand-blue font-bold text-lg mb-4">${p.price} ₽</p>
            <button onclick="deleteItem('products', '${p.id}')" class="w-full py-2 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all">Удалить</button>
        </div>
    `).join('');
}

// Загрузка проектов
async function loadProjects() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('projects-admin-list');
    if (error) return;

    container.innerHTML = data.map(p => `
        <div class="bg-[#1c212e] p-6 rounded-2xl border border-gray-800">
            <div class="flex justify-between items-start mb-4">
                <h4 class="font-bold text-lg text-brand-blue">${p.title}</h4>
                <button onclick="deleteItem('projects', '${p.id}')" class="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">Удалить</button>
            </div>
            <p class="text-gray-400 text-sm mb-4 line-clamp-3">${p.description || 'Нет описания'}</p>
            ${p.link ? `<a href="${p.link}" target="_blank" class="text-xs text-gray-500 underline hover:text-brand-blue">Перейти к проекту</a>` : ''}
        </div>
    `).join('');
}

// Загрузка настроек
async function loadSettings() {
    const { data, error } = await supabase.from('site_settings').select('*').single();
    if (data) {
        settingsForm.tg_link.value = data.tg_link || '';
        settingsForm.yt_link.value = data.yt_link || '';
        settingsForm.email_contact.value = data.email_contact || '';
    }
}

// --- 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (STORAGE И УДАЛЕНИЕ) ---

// Загрузка файла в бакет 'product-images'
async function uploadImage(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

    if (error) {
        alert("Ошибка загрузки изображения: " + error.message);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

// Глобальная функция удаления
window.deleteItem = async (table, id) => {
    if (!confirm("Вы уверены, что хотите удалить этот элемент?")) return;

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert("Ошибка при удалении: " + error.message);
    else loadAllData();
};

// --- 5. ОБРАБОТКА ФОРМ ---

// Добавление товара
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'Загрузка файла...';

    const formData = new FormData(e.target);
    const imageFile = formData.get('image_file');
    const imageUrl = await uploadImage(imageFile);

    if (!imageUrl) {
        btn.disabled = false;
        btn.innerText = 'Опубликовать товар';
        return;
    }

    const { error } = await supabase.from('products').insert([{
        title: formData.get('title'),
        price: formData.get('price'),
        category: formData.get('category'),
        shop_link: formData.get('shop_link'),
        description: formData.get('description'),
        image_main: imageUrl
    }]);

    if (error) alert("Ошибка БД: " + error.message);
    else {
        e.target.reset();
        await loadProducts();
    }
    btn.disabled = false;
    btn.innerText = 'Опубликовать товар';
});

// Добавление проекта
addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'Сохранение...';

    const formData = new FormData(e.target);
    const { error } = await supabase.from('projects').insert([{
        title: formData.get('title'),
        link: formData.get('link'),
        description: formData.get('description')
    }]);

    if (error) alert("Ошибка БД: " + error.message);
    else {
        e.target.reset();
        await loadProjects();
    }
    btn.disabled = false;
    btn.innerText = 'Добавить проект';
});

// Сохранение настроек (Upsert)
settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const updates = {
        id: 1, // Мы храним настройки в одной строке с ID 1
        tg_link: e.target.tg_link.value,
        yt_link: e.target.yt_link.value,
        email_contact: e.target.email_contact.value,
        updated_at: new Date()
    };

    const { error } = await supabase.from('site_settings').upsert(updates);

    if (error) alert("Ошибка сохранения: " + error.message);
    else alert("Настройки успешно обновлены!");

    btn.disabled = false;
});

// --- 6. ТАБЫ ---

window.showTab = (tabName) => {
    // Скрываем все секции
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    // Показываем нужную
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    // Сбрасываем стили кнопок
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-brand-blue');
        b.classList.add('bg-[#1c212e]');
    });

    // Подсвечиваем активную (через window.event)
    if (window.event) {
        const target = window.event.currentTarget;
        target.classList.remove('bg-[#1c212e]');
        target.classList.add('bg-brand-blue');
    }
};

// Запуск
checkSession();