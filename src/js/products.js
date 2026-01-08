import { createClient } from '@supabase/supabase-js'

// Инициализация клиента Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Получение товаров из реальной БД
export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true })

    if (error) {
        console.error('Ошибка Supabase:', error.message)
        throw error
    }
    return data
}

// Генерация HTML карточки (обновленная под структуру БД)
export function createProductCard(product) {
    const formattedPrice = new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB', maximumFractionDigits: 0
    }).format(product.price);

    return `
        <div class="product-card bg-white p-6 rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-brand-blue/20 group cursor-pointer fade-in" 
             onclick="window.openModal(${product.id})">
            <div class="bg-gray-50 h-56 rounded-[24px] mb-6 flex items-center justify-center overflow-hidden relative">
                <img src="${product.image_main}" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                    ${product.category}
                </span>
            </div>
            <div class="text-left">
                <h3 class="text-xl font-bold text-brand-dark mb-2 group-hover:text-brand-blue transition-colors">${product.title}</h3>
                <p class="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">${product.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-bold text-brand-dark">${formattedPrice}</span>
                    <div class="bg-brand-dark text-white p-3 rounded-2xl group-hover:bg-brand-blue transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </div>
                </div>
            </div>
        </div>
    `;
}