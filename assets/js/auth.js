// ============================================
// LNF FANTASY - SISTEMA DE AUTENTICAÇÃO
// ============================================

/**
 * Sistema de autenticação com Supabase
 * Liga Nacional de Futsal - Fantasy Game
 */

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let usuarioAtual = null;

// ============================================
// ANIMAÇÃO DE BOLA DE FUTSAL
// ============================================

/**
 * Mostra animação de bola de futsal atravessando a tela
 * @param {Function} callback - Função a ser executada após a animação
 */
function mostrarAnimacaoBola(callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #FF6B00 0%, #003366 100%);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    `;
    
    const bolaContainer = document.createElement('div');
    bolaContainer.style.cssText = `
        position: absolute;
        left: -150px;
        animation: moveBall 1.5s ease-in-out forwards;
    `;
    
    bolaContainer.innerHTML = `
        <svg width="100" height="100" viewBox="0 0 100 100" style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));">
            <style>
                @keyframes rotateBall {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(720deg); }
                }
                @keyframes moveBall {
                    0% {
                        left: -150px;
                        top: 50%;
                    }
                    50% {
                        left: 50%;
                        top: 30%;
                    }
                    100% {
                        left: calc(100% + 150px);
                        top: 50%;
                    }
                }
                .ball-rotate {
                    transform-origin: center;
                    animation: rotateBall 1.5s linear infinite;
                }
            </style>
            <g class="ball-rotate">
                <circle cx="50" cy="50" r="48" fill="white" stroke="#FF6B00" stroke-width="2"/>
                <polygon points="50,10 35,25 42,45 58,45 65,25" fill="#FF6B00"/>
                <polygon points="20,35 15,50 28,65 40,60 35,40" fill="#FF6B00"/>
                <polygon points="80,35 85,50 72,65 60,60 65,40" fill="#FF6B00"/>
                <polygon points="35,75 42,90 58,90 65,75 50,70" fill="#FF6B00"/>
                <path d="M 42,45 L 35,40" stroke="#003366" stroke-width="1.5" fill="none"/>
                <path d="M 58,45 L 65,40" stroke="#003366" stroke-width="1.5" fill="none"/>
            </g>
        </svg>
    `;
    
    const texto = document.createElement('div');
    texto.style.cssText = `
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
        animation: pulse 1.5s ease-in-out infinite;
    `;
    texto.innerHTML = `
        <style>
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        </style>
        🏆 Carregando LNF Fantasy...
    `;
    
    overlay.appendChild(bolaContainer);
    overlay.appendChild(texto);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.style.transition = 'opacity 0.3s';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    }, 1500);
}

// ============================================
// ALTERNÂNCIA DE FORMULÁRIOS
// ============================================

function mostrarLogin() {
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');
    const btnLogin = document.getElementById('btn-login');
    const btnCadastro = document.getElementById('btn-cadastro');
    
    if (formLogin) formLogin.classList.remove('hidden');
    if (formCadastro) formCadastro.classList.add('hidden');
    
    if (btnLogin) {
        btnLogin.classList.add('bg-white', 'dark:bg-gray-800', 'shadow-sm', 'text-lnf-orange');
        btnLogin.classList.remove('text-gray-600', 'dark:text-gray-400');
    }
    
    if (btnCadastro) {
        btnCadastro.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow-sm', 'text-lnf-orange');
        btnCadastro.classList.add('text-gray-600', 'dark:text-gray-400');
    }
    
    limparMensagem();
}

function mostrarCadastro() {
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');
    const btnLogin = document.getElementById('btn-login');
    const btnCadastro = document.getElementById('btn-cadastro');
    
    if (formLogin) formLogin.classList.add('hidden');
    if (formCadastro) formCadastro.classList.remove('hidden');
    
    if (btnCadastro) {
        btnCadastro.classList.add('bg-white', 'dark:bg-gray-800', 'shadow-sm', 'text-lnf-orange');
        btnCadastro.classList.remove('text-gray-600', 'dark:text-gray-400');
    }
    
    if (btnLogin) {
        btnLogin.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow-sm', 'text-lnf-orange');
        btnLogin.classList.add('text-gray-600', 'dark:text-gray-400');
    }
    
    limparMensagem();
}

// ============================================
// MENSAGENS
// ============================================

function mostrarMensagem(mensagem, tipo = 'info') {
    const container = document.getElementById('mensagem-auth');
    if (!container) return;
    
    container.classList.remove('hidden');
    
    const cores = {
        'sucesso': 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-200',
        'erro': 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-200',
        'info': 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200'
    };
    
    const icones = {
        'sucesso': '✓',
        'erro': '✗',
        'info': 'ℹ'
    };
    
    container.className = `mt-4 p-4 rounded-lg border-2 ${cores[tipo] || cores.info}`;
    container.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-xl font-bold">${icones[tipo] || icones.info}</span>
            <span>${mensagem}</span>
        </div>
    `;
}

function limparMensagem() {
    const container = document.getElementById('mensagem-auth');
    if (!container) return;
    
    container.classList.add('hidden');
    container.innerHTML = '';
}

// ============================================
// LOGIN
// ============================================

async function fazerLogin(email, senha) {
    try {
        console.log('🔐 Tentando fazer login...');
        
        if (!email || !senha) {
            throw new Error('Preencha todos os campos');
        }
        
        mostrarMensagem('Entrando no LNF Fantasy...', 'info');
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: senha
        });

        if (authError) {
            console.error('❌ Erro de autenticação:', authError);
            
            if (authError.message.includes('Invalid login credentials')) {
                throw new Error('Email ou senha incorretos');
            }
            
            throw new Error(authError.message);
        }

        console.log('✅ Autenticação bem-sucedida:', authData.user.email);

        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError || !userData) {
            console.error('❌ Erro ao buscar perfil:', userError);
            throw new Error('Perfil não encontrado. Aguarde alguns segundos e tente novamente.');
        }
        
        usuarioAtual = userData;
        console.log('✅ Perfil carregado:', usuarioAtual.team_name);
        
        mostrarMensagem('Login realizado com sucesso!', 'sucesso');
        
        setTimeout(() => {
            mostrarAnimacaoBola(() => {
                if (usuarioAtual.role === 'admin' || usuarioAtual.is_admin) {
                    console.log('🔑 Redirecionando para painel admin...');
                    window.location.href = 'admin.html';
                } else {
                    console.log('👤 Redirecionando para dashboard...');
                    window.location.href = 'dashboard.html';
                }
            });
        }, 1000);

    } catch (error) {
        console.error('❌ Erro no login:', error);
        mostrarMensagem(error.message, 'erro');
    }
}

// ============================================
// CADASTRO
// ============================================

async function fazerCadastro(teamName, email, senha) {
    try {
        console.log('📝 Iniciando cadastro...');

        if (!teamName || teamName.trim().length < 3) {
            throw new Error('Nome do time deve ter pelo menos 3 caracteres');
        }

        if (!email || !email.includes('@')) {
            throw new Error('Email inválido');
        }

        if (!senha || senha.length < 6) {
            throw new Error('Senha deve ter pelo menos 6 caracteres');
        }

        mostrarMensagem('Criando sua conta no LNF Fantasy...', 'info');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password: senha
        });

        if (signUpError) {
            console.error('❌ Erro no Auth:', signUpError);
            
            if (signUpError.message.includes('already registered')) {
                throw new Error('Este email já está cadastrado. Faça login.');
            }
            
            throw new Error(signUpError.message);
        }

        if (!signUpData.user) {
            throw new Error('Erro ao criar usuário. Tente novamente.');
        }

        console.log('✅ Usuário criado no Auth:', signUpData.user.id);

        await new Promise(resolve => setTimeout(resolve, 1000));

        let session = signUpData.session;
        
        if (!session) {
            console.log('🔐 Fazendo login automático...');
            
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: senha
            });

            if (signInError) {
                throw new Error('Conta criada! Faça login para continuar.');
            }

            session = signInData.session;
            console.log('✅ Login automático bem-sucedido');
        }

        console.log('📝 Atualizando nome do time...');
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ team_name: teamName.trim() })
            .eq('id', signUpData.user.id);

        if (updateError) {
            console.error('⚠️ Erro ao atualizar nome do time:', updateError);
        } else {
            console.log('✅ Nome do time atualizado:', teamName);
        }

        mostrarMensagem('🎉 Conta criada! Bem-vindo ao LNF Fantasy!', 'sucesso');

        setTimeout(() => {
            mostrarAnimacaoBola(() => {
                console.log('🔄 Redirecionando para dashboard...');
                window.location.href = 'dashboard.html';
            });
        }, 2000);

    } catch (error) {
        console.error('❌ ERRO:', error);
        mostrarMensagem(error.message, 'erro');
    }
}

// ============================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// ============================================

async function verificarAutenticacao() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.log('⚠️ Usuário não autenticado');
            return null;
        }

        console.log('✅ Usuário autenticado:', user.email);

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            console.error('❌ Erro ao buscar dados:', userError);
            return null;
        }

        usuarioAtual = userData;
        return usuarioAtual;

    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        return null;
    }
}

async function verificarAutenticacaoOuRedirecionar() {
    const usuario = await verificarAutenticacao();
    
    if (!usuario) {
        window.location.href = 'index.html';
        return null;
    }
    
    return usuario;
}

async function verificarAdmin() {
    const usuario = await verificarAutenticacao();
    
    if (!usuario) return false;
    
    return usuario.role === 'admin' || usuario.is_admin === true;
}

// ============================================
// LOGOUT
// ============================================

async function logout() {
    try {
        console.log('🚪 Fazendo logout...');
        
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        usuarioAtual = null;
        
        console.log('✅ Logout realizado');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        alert('Erro ao sair: ' + error.message);
    }
}

// ============================================
// EVENTOS DOS FORMULÁRIOS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ auth.js carregado - LNF Fantasy');

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email')?.value || '';
            const senha = document.getElementById('login-senha')?.value || '';
            
            await fazerLogin(email, senha);
        });
    }

    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const teamName = document.getElementById('cadastro-time')?.value || '';
            const email = document.getElementById('cadastro-email')?.value || '';
            const senha = document.getElementById('cadastro-senha')?.value || '';
            
            await fazerCadastro(teamName, email, senha);
        });
    }
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        verificarAutenticacao().then(usuario => {
            if (usuario) {
                console.log('✅ Usuário já logado, redirecionando...');
                mostrarAnimacaoBola(() => {
                    if (usuario.role === 'admin' || usuario.is_admin) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                });
            }
        });
    }
});

// ============================================
// EXPORTAÇÃO
// ============================================

window.auth = {
    mostrarLogin,
    mostrarCadastro,
    fazerLogin,
    fazerCadastro,
    verificarAutenticacao,
    verificarAutenticacaoOuRedirecionar,
    verificarAdmin,
    logout,
    usuarioAtual: () => usuarioAtual
};

window.mostrarLogin = mostrarLogin;
window.mostrarCadastro = mostrarCadastro;
window.logout = logout;
window.verificarAutenticacao = verificarAutenticacao;

console.log('✅ Sistema de autenticação LNF Fantasy inicializado ⚽');