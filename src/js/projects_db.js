import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: true })

    if (error) throw error;
    return data;
}

export function createProjectCard(project) {
    // Выбираем стили в зависимости от поля is_dark_mode
    const cardStyle = project.is_dark_mode 
        ? "bg-brand-dark text-white" 
        : "bg-gray-50 text-brand-dark border border-gray-100 hover:border-brand-blue/30";
    
    const tagStyle = project.is_dark_mode 
        ? "bg-white/10 text-white/70" 
        : "bg-white text-gray-400";

    return `
      <div class="group relative rounded-[40px] p-8 md:p-12 overflow-hidden transition-all duration-500 fade-in ${cardStyle}">
        <div class="relative z-10 flex flex-col h-full">
          <div class="flex gap-2 mb-6">
            ${project.tags.map(tag => `<span class="px-3 py-1 rounded-full text-xs font-bold ${tagStyle}">${tag}</span>`).join('')}
          </div>
          <h3 class="text-3xl font-bold mb-4 group-hover:text-brand-blue transition-colors">${project.title}</h3>
          <p class="${project.is_dark_mode ? 'text-white/60' : 'text-gray-600'} mb-8 flex-1 leading-relaxed text-lg">
            ${project.description}
          </p>
          <div class="flex items-center gap-6">
             ${project.demo_link ? `
               <a href="${project.demo_link}" target="_blank" class="font-bold flex items-center gap-2 group/link">
                 Demo <i data-lucide="external-link" class="w-4 h-4 opacity-50 group-hover/link:opacity-100"></i>
               </a>` : ''}
             ${project.source_link ? `
               <a href="${project.source_link}" target="_blank" class="font-bold flex items-center gap-2 group/link">
                 Source <i data-lucide="github" class="w-4 h-4 opacity-50 group-hover/link:opacity-100"></i>
               </a>` : ''}
          </div>
        </div>
        ${project.is_dark_mode ? `
          <div class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <i data-lucide="layout" class="w-48 h-48"></i>
          </div>` : `
          <div class="absolute -bottom-10 -right-10 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl group-hover:bg-brand-blue/10 transition-colors"></div>
        `}
      </div>
    `;
}