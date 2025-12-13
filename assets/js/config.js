// ============================================
// LNF FANTASY - CONFIGURAÇÃO
// ============================================

const CONFIG = {
    // Supabase (substitua com suas credenciais)
    SUPABASE_URL: 'https://ocratwtvhripofiyxetw.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcmF0d3R2aHJpcG9maXl4ZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODc2NDAsImV4cCI6MjA4MTA2MzY0MH0.8CbFwuhH10zGLH5IGuyF1-F4pn9xbPLgb-WPwkK0SFA',
    
    // Configurações do sistema
    SALDO_INICIAL: 100.00,
    MAX_JOGADORES: 5,
    
    // Formação obrigatória
    FORMACAO: {
        GOL: 1,
        FIX: 1,
        ALA: 2,
        PIV: 1
    },
    
    // Pontuação
    PONTOS: {
        goals: 8,
        assists: 5,
        shots_on_target: 3,
        saves: 7,
        clean_sheet: 5,
        own_goals: -3,
        yellow_cards: -1,
        red_cards: -5,
        fouls: -0.3
    }
};

// Inicializar Supabase
let supabase;

if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
    );
    console.log('✓ Supabase inicializado');
} else {
    console.error('✗ Biblioteca Supabase não encontrada');
}