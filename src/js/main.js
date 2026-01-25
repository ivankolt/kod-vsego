import '../css/style.css';
import { getProducts, createProductCard } from './products.js';
import { createClient } from '@supabase/supabase-js';
import {
    createIcons, Mail, Github, Send, Youtube, MessageCircle,
    ArrowUpRight, Menu, ArrowRight, X, MessageSquare, ChevronDown, Bot,
    Check, Layout, 
    // Новые иконки:
    List, AlertTriangle, Copy, Download, ExternalLink, ArrowDown
} from 'lucide';
import { getProjects, createProjectCard } from './projects_db.js';
import IMask from 'imask';

const iconConfig = {
    Mail, Github, Send, Youtube, MessageCircle,
    ArrowUpRight, Menu, ArrowRight, X, MessageSquare, ChevronDown, Bot,
    Check, Layout,
    // Обязательно добавьте их сюда тоже:
    List, AlertTriangle, Copy, Download, ExternalLink, ArrowDown
};

// Безопасная инициализация Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

let allProducts = [];
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.getElementById('product-grid');
    const projectsGrid = document.getElementById('projects-grid');
    const hero = document.getElementById('hero-content');
    const glow = document.getElementById('cursor-glow');
    
    const modal = document.getElementById('product-modal');
    const closeModalBtn = document.getElementById('close-modal');
    
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatHeader = document.getElementById('chat-header');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const navChatLink = document.getElementById('nav-chat-link');
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('form-success');

    // Инициализация
    createIcons({ icons: iconConfig });
    initMatrixAnimation();

    // Курсор glow
    window.addEventListener('mousemove', (e) => {
        if (glow) {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        }
    });

    // Загрузка данных ОДИН РАЗ
    try {
        await Promise.all([
            applySiteSettings(),
            productGrid ? loadProductsData(productGrid) : Promise.resolve(),
            projectsGrid ? loadProjectsData(projectsGrid) : Promise.resolve()
        ]);
        
        initScrollReveal();
        if (hero) hero.classList.add('visible');
    } catch (e) {
        console.error("Ошибка при загрузке:", e);
    }

    // Модал
    setupModal(modal, closeModalBtn);

    // Чат dragging
    setupChatDragging(chatHeader, chatWindow);

    // Управление чатом
    setupChatToggle(chatToggle, chatWindow, navChatLink, chatInput);

    // Форма чата
    setupChatForm(chatForm, chatMessages, chatInput);

    // Телефон маска
    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) {
        IMask(phoneInput, { mask: '+{7} (000) 000-00-00', lazy: false });
    }

    // Форма контактов
    setupContactForm(contactForm, successMessage);
}, { once: true });

async function loadProductsData(grid) {
    allProducts = await getProducts();
    grid.innerHTML = allProducts.map(p => createProductCard(p)).join('');
    createIcons({ icons: iconConfig });
}

async function loadProjectsData(grid) {
    const projects = await getProjects();
    grid.innerHTML = projects.map(p => createProjectCard(p)).join('');
    createIcons({ icons: iconConfig });
}

function setupModal(modal, closeModalBtn) {
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }
}

function setupChatDragging(chatHeader, chatWindow) {
    if (!chatHeader || !chatWindow) return;

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

function setupChatToggle(chatToggle, chatWindow, navChatLink, chatInput) {
    if (navChatLink && chatWindow) {
        navChatLink.addEventListener('click', (e) => {
            e.preventDefault();
            chatWindow.classList.remove('hidden');
            chatWindow.classList.add('flex');
            if (chatInput) chatInput.focus();
        });
    }

    if (chatToggle && chatWindow) {
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            chatWindow.classList.toggle('flex');
        });
    }
}

function setupChatForm(chatForm, chatMessages, chatInput) {
    if (!chatForm || !supabase) {
        console.warn('Supabase не инициализирован, чат отключен');
        return;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user', chatMessages);
        chatInput.value = '';
        showTypingIndicator(chatMessages);

        try {
            const { data, error } = await supabase.functions.invoke('ai-chat', {
                body: { message: text }
            });
            document.getElementById('typing-indicator')?.remove();
            if (error) throw error;
            addMessage(data.reply, 'bot', chatMessages);
        } catch (err) {
            document.getElementById('typing-indicator')?.remove();
            addMessage('Ошибка связи с ИИ. Проверьте консоль.', 'bot', chatMessages);
            console.error('Chat error:', err);
        }
    });
}

function showTypingIndicator(chatMessages) {
    const loader = document.createElement('div');
    loader.id = 'typing-indicator';
    loader.className = 'message-appear bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 mr-auto flex gap-1 items-center mb-2';
    loader.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(loader);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text, sender, chatMessages) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message-appear p-4 rounded-2xl text-sm max-w-[85%] mb-2 ${
        sender === 'user'
            ? 'bg-brand-blue text-white ml-auto rounded-tr-none shadow-md'
            : 'bg-white text-gray-700 mr-auto rounded-tl-none shadow-sm border border-gray-100'
    }`;
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setupContactForm(contactForm, successMessage) {
    if (!contactForm || !supabase) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        if (!btn) return;

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
            if (successMessage) successMessage.classList.remove('hidden');
        } catch (error) {
            console.error('Form submit error:', error);
            btn.disabled = false;
            btn.innerHTML = 'Ошибка. Попробовать еще раз';
        }
    });
}

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

async function applySiteSettings() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .single();

        if (error) throw error;

        if (data) {
            const emailElem = document.getElementById('display-email');
            if (emailElem && data.email_contact) {
                emailElem.innerText = data.email_contact;
            }

            const tgElem = document.getElementById('display-tg-link');
            if (tgElem && data.tg_link) {
                tgElem.href = data.tg_link;
            }

            const ytElem = document.getElementById('display-yt-link');
            if (ytElem && data.yt_link) {
                ytElem.href = data.yt_link;
            }
            
            const mainTgBtn = document.querySelector('a[href*="t.me/Privatnumber5"]');
            if (mainTgBtn && data.tg_link) {
                mainTgBtn.href = data.tg_link;
            }

            const bannerTgElem = document.getElementById('banner-tg-link');
            if (bannerTgElem && data.tg_link) {
                bannerTgElem.href = data.tg_link;
            }

            console.log("Контакты из БД успешно применены");
        }
    } catch (e) {
        console.error("Ошибка обновления контактов:", e.message);
    }
}

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
            
            if (drops[i] * fontSize > height && Math.random() > 0.985) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    // Resize handler
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    setInterval(draw, 50);
}

window.openModal = (productId) => {
    const modal = document.getElementById('product-modal');
    const product = allProducts.find(p => String(p.id) === String(productId));
    
    if (modal && product) {
        const priceText = new Intl.NumberFormat('ru-RU', {
            style: 'currency', 
            currency: 'RUB', 
            maximumFractionDigits: 0
        }).format(product.price);

        document.getElementById('modal-content').innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <div class="w-full md:w-1/2 h-[400px] md:h-[600px] rounded-3xl overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                    <img src="${product.image_main}" 
                         alt="${product.title}" 
                         class="max-w-full max-h-full object-contain drop-shadow-md">
                </div>
                
                <div class="w-full md:w-1/2 flex flex-col gap-6 text-left">
                    <div class="space-y-2">
                        <span class="text-brand-blue font-bold text-xs uppercase tracking-widest">${product.category}</span>
                        <h2 class="text-4xl font-bold tracking-tight text-brand-dark leading-tight">${product.title}</h2>
                    </div>
                    
                    <div class="text-gray-600 text-lg leading-relaxed overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                        ${product.description}
                    </div>

                    <div class="mt-auto pt-6 flex items-center justify-between border-t border-gray-100">
                        <span class="text-3xl font-bold text-brand-dark">${priceText}</span>
                        <a href="${product.shop_link}" target="_blank" 
                           class="bg-brand-dark text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-blue transition-all flex items-center gap-2 group">
                           Купить <i data-lucide="arrow-up-right" class="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        createIcons({ icons: iconConfig });
    }
};
