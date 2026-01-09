import '../css/style.css';
import { getProducts, createProductCard } from './products.js';
import { createClient } from '@supabase/supabase-js'
import {
    createIcons, Mail, Github, Send, Youtube, MessageCircle,
    ArrowUpRight, Menu, ArrowRight, X, MessageSquare, ChevronDown, Bot,
    Check, Layout
} from 'lucide';
import { getProjects, createProjectCard } from './projects_db.js';
import IMask from 'imask';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Инициализация иконок
    const iconConfig = {
        Mail, Github, Send, Youtube, MessageCircle,
        ArrowUpRight, Menu, ArrowRight, X, MessageSquare, ChevronDown, Bot,
        Check, Layout
    };
    createIcons({ icons: iconConfig });

    // 2. Выбор элементов
    const productGrid = document.getElementById('product-grid');
    const modal = document.getElementById('product-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal');
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('form-success');

    // Элементы чата
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatHeader = document.getElementById('chat-header'); // Добавлено!
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const navChatLink = document.getElementById('nav-chat-link');
    const glow = document.getElementById('cursor-glow');

    const modal = document.getElementById('product-modal');

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    
        // Закрытие при клике на темный фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }

    // --- ЛОГИКА СВЕЧЕНИЯ КУРСОРA ---
    window.addEventListener('mousemove', (e) => {
        if (glow) {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        }
    });

    // --- ПЕРЕТАСКИВАНИЕ ЧАТА (DRAGGING) ---
    if (chatHeader && chatWindow) {
        let isDragging = false;
        let offsetX, offsetY;

        chatHeader.addEventListener('mousedown', (e) => {
            isDragging = true;
            chatWindow.classList.add('dragging');
            const rect = chatWindow.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            chatWindow.style.bottom = 'auto';
            chatWindow.style.right = 'auto';
            chatWindow.style.left = rect.left + 'px';
            chatWindow.style.top = rect.top + 'px';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            const maxX = window.innerWidth - chatWindow.offsetWidth;
            const maxY = window.innerHeight - chatWindow.offsetHeight;
            chatWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            chatWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            chatWindow.classList.remove('dragging');
        });
    }

    // --- УПРАВЛЕНИЕ ЧАТОМ ---
    if (navChatLink && chatWindow) {
        navChatLink.addEventListener('click', (e) => {
            e.preventDefault();
            chatWindow.classList.remove('hidden');
            chatWindow.classList.add('flex');
            if (chatInput) chatInput.focus();
        });
    }

    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        chatWindow.classList.toggle('flex');
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        showTypingIndicator();

        try {
            const { data, error } = await supabase.functions.invoke('ai-chat', {
                body: { message: text }
            });
            document.getElementById('typing-indicator')?.remove();
            if (error) throw error;
            addMessage(data.reply, 'bot');
        } catch (err) {
            document.getElementById('typing-indicator')?.remove();
            addMessage('Ошибка связи с ИИ.', 'bot');
        }
    });

    function showTypingIndicator() {
        const loader = document.createElement('div');
        loader.id = 'typing-indicator';
        loader.className = 'message-appear bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 mr-auto flex gap-1 items-center mb-2';
        loader.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        chatMessages.appendChild(loader);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-appear p-4 rounded-2xl text-sm max-w-[85%] mb-2 ${sender === 'user'
                ? 'bg-brand-blue text-white ml-auto rounded-tr-none shadow-md'
                : 'bg-white text-gray-700 mr-auto rounded-tl-none shadow-sm border border-gray-100'
            }`;
        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- МАТРИЦА ---
    initMatrixAnimation();

    // --- ОСТАЛЬНАЯ ЛОГИКА (SCROLL, МАСКИ, ФОРМЫ) ---
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }

    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) {
        IMask(phoneInput, { mask: '+{7} (000) 000-00-00', lazy: false });
    }

    // Форма предложений
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.innerHTML = 'Отправка...';
            const formData = new FormData(contactForm);
            try {
                const { error } = await supabase.from('contact_submissions').insert([{
                    first_name: formData.get('first_name'),
                    last_name: formData.get('last_name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    message: formData.get('message')
                }]);
                if (error) throw error;
                contactForm.classList.add('hidden');
                successMessage.classList.remove('hidden');
            } catch (error) {
                btn.disabled = false;
                btn.innerHTML = 'Ошибка. Попробовать еще раз';
            }
        });
    }

    // Загрузка товаров
    if (productGrid) {
        try {
            allProducts = await getProducts();
            productGrid.innerHTML = allProducts.map(p => createProductCard(p)).join('');
            createIcons({ icons: iconConfig });
            initScrollReveal();
        } catch (e) { console.error(e); }
    }

    // Загрузка проектов
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        try {
            const projects = await getProjects();
            projectsGrid.innerHTML = projects.map(p => createProjectCard(p)).join('');
            createIcons({ icons: iconConfig });
            initScrollReveal();
        } catch (e) { console.error(e); }
    }

    const hero = document.getElementById('hero-content');
    if (hero) setTimeout(() => hero.classList.add('visible'), 100);
});

// Функция матрицы
function initMatrixAnimation() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops = Array(columns).fill(1);
    function draw() {
        ctx.fillStyle = 'rgba(20, 24, 35, 0.1)';
        ctx.fillRect(0, 0, width, height);
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
            const text = Math.random() > 0.5 ? '0' : '1';
            ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#00aeef';
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > height && Math.random() > 0.985) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 50);
}

window.openModal = (productId) => {
    const modal = document.getElementById('product-modal');
    const product = allProducts.find(p => p.id === productId);
    
    if (modal && product) {
        // Здесь твоя логика заполнения модалки данными товара
        document.getElementById('modal-content').innerHTML = `
            <h2 class="text-2xl font-bold">${product.name}</h2>
            <p class="mt-4">${product.description}</p>
        `;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};
