// ============================================
// LNF FANTASY - CONFIGURAÇÃO DO SUPABASE
// ============================================

/**
 * Configurações da API Supabase
 * Liga Nacional de Futsal - Fantasy Game
 */

// Credenciais do Supabase
const SUPABASE_URL = 'https://ocratwtvhripofiyxetw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcmF0d3R2aHJpcG9maXl4ZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODc2NDAsImV4cCI6MjA4MTA2MzY0MH0.8CbFwuhH10zGLH5IGuyF1-F4pn9xbPLgb-WPwkK0SFA';

// Verificar se a biblioteca Supabase está carregada
if (typeof window.supabase === 'undefined') {
    console.error('❌ Biblioteca Supabase não encontrada! Verifique se o script está incluído no HTML.');
} else {
    // Inicializar cliente Supabase
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Tornar disponível globalmente
    window.supabase = supabase;
    
    console.log('✅ Supabase inicializado - LNF Fantasy');
}

// Constantes do sistema LNF
const SISTEMA = {
    NOME: 'LNF Fantasy',
    VERSAO: '1.0.0',
    DESCRICAO: 'Fantasy Game da Liga Nacional de Futsal',
    SALDO_INICIAL: 100.00,  // Cartoletas iniciais para cada usuário
    MAX_JOGADORES: 5,        // 1 GOL, 1 FIX, 2 ALA, 1 PIV
    TEMPORADA: '2025',
    
    // Cores oficiais LNF
    CORES: {
        LARANJA: '#FF6B00',
        AZUL: '#003366',
        AZUL_ESCURO: '#001a33'
    },
    
    // Formação obrigatória (Futsal)
    FORMACAO: {
        GOL: 1,  // Goleiro
        FIX: 1,  // Fixo
        ALA: 2,  // Alas
        PIV: 1   // Pivô
    },
    
    // Faixas de preço sugeridas
    PRECOS: {
        ESTRELA: { min: 8.00, max: 15.00 },      // Top 10 da LNF
        TITULAR_GRANDE: { min: 5.00, max: 7.99 }, // Titulares grandes clubes
        BOM_JOGADOR: { min: 3.00, max: 4.99 },   // Bons jogadores
        COMUM: { min: 1.00, max: 2.99 }          // Jogadores comuns
    }
};

// Informações da LNF
const LNF_INFO = {
    nome_completo: 'Liga Nacional de Futsal',
    sigla: 'LNF',
    ano_fundacao: 1996,
    website: 'https://www.lnf.com.br',
    total_times: 16,
    formato: 'Pontos Corridos + Playoffs',
    
    // Estrutura da competição
    fases: {
        classificacao: 30,  // 30 rodadas
        quartas: 3,         // Melhor de 3
        semifinal: 3,       // Melhor de 3
        final: 3            // Melhor de 3
    }
};

// Times da LNF 2025 (exemplos - atualizar com times reais)
const TIMES_LNF = [
    'Magnus Futsal',
    'Pato Futsal',
    'Corinthians',
    'Joinville',
    'Praia Clube',
    'Jaraguá',
    'Cascavel',
    'AABF/Apucarana',
    'Atlântico Erechim',
    'Foz Cataratas',
    'Campo Mourão',
    'Concórdia',
    'Blumenau',
    'Tubarão',
    'Marreco',
    'Juventude'
];

// Exportar configurações
window.SISTEMA = SISTEMA;
window.LNF_INFO = LNF_INFO;
window.TIMES_LNF = TIMES_LNF;

console.log('⚽ LNF Fantasy inicializado');
console.log(`💰 Saldo inicial: C$ ${SISTEMA.SALDO_INICIAL.toFixed(2)}`);
console.log(`👥 Jogadores por time: ${SISTEMA.MAX_JOGADORES}`);
console.log(`🏆 Temporada: ${SISTEMA.TEMPORADA}`);