// ============================================
// LNF FANTASY - MERCADO ESTILO CARTOLA FC
// ============================================

let usuarioLogado = null;
let jogadoresDisponiveis = [];
let saldoAtual = 100.00;
let mercadoAberto = true;

// Estrutura da escalação FUTSAL
let escalacaoAtual = {
    'GOL': null,
    'FIX': null,
    'ALA': [null, null],
    'PIV': null
};

const FORMACAO_LIMITES = {
    'GOL': 1,
    'FIX': 1,
    'ALA': 2,
    'PIV': 1
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando Mercado Cartola LNF...');
    
    usuarioLogado = await verificarAutenticacao();
    if (!usuarioLogado) {
        window.location.href = 'index.html';
        return;
    }

    await inicializarMercado();
});

async function inicializarMercado() {
    try {
        await verificarStatusMercado();
        await carregarSaldoUsuario();
        await carregarJogadores();
        await carregarEscalacaoAtual();
        
        configurarFiltros();
        renderizarJogadores();
        renderizarEscalacao();
        atualizarDisplays();
        
        console.log('✅ Mercado Cartola LNF inicializado!');
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
    }
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

async function carregarSaldoUsuario() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('cartoletas')
            .eq('id', usuarioLogado.id)
            .single();
        
        if (error) throw error;
        
        saldoAtual = data.cartoletas || 100.00;
    } catch (error) {
        console.error('Erro ao carregar saldo:', error);
        saldoAtual = 100.00;
    }
}

async function carregarJogadores() {
    try {
        const { data, error } = await supabase
            .from('players')
            .select(`
                id,
                name,
                position,
                price,
                photo_url,
                team:teams(name, logo_url)
            `)
            .order('price', { ascending: false });
        
        if (error) throw error;
        
        // Adicionar dados simulados de variação e estatísticas
        jogadoresDisponiveis = (data || []).map(jogador => ({
            ...jogador,
            status: getRandomStatus(),
            variacao: getRandomVariacao(),
            pontos_ultima: getRandomPontos(),
            media_pontos: getRandomMedia(),
            jogos: getRandomJogos(),
            confronto: getRandomConfronto()
        }));
        
        console.log('✅ Jogadores carregados:', jogadoresDisponiveis.length);
    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
        jogadoresDisponiveis = [];
    }
}

async function carregarEscalacaoAtual() {
    try {
        const { data: rodadaPendente } = await supabase
            .from('rounds')
            .select('id')
            .eq('status', 'pending')
            .single();
        
        if (!rodadaPendente) return;
        
        const { data: minhaEscalacao } = await supabase
            .from('lineups')
            .select('id')
            .eq('user_id', usuarioLogado.id)
            .eq('round_id', rodadaPendente.id)
            .single();
        
        if (!minhaEscalacao) return;
        
        const { data: jogadoresEscalacao } = await supabase
            .from('lineup_players')
            .select(`
                player_id,
                players (id, name, position, price, photo_url, team_id, teams(name, logo_url))
            `)
            .eq('lineup_id', minhaEscalacao.id);
        
        if (!jogadoresEscalacao) return;
        
        resetarEscalacao();
        
        jogadoresEscalacao.forEach(lp => {
            const jogador = lp.players;
            adicionarJogadorNaEscalacao(jogador);
        });
        
        console.log('✅ Escalação carregada');
    } catch (error) {
        console.error('Erro ao carregar escalação:', error);
    }
}

// ============================================
// RENDERIZAÇÃO DE JOGADORES (ESTILO CARTOLA)
// ============================================

function renderizarJogadores() {
    const tbody = document.getElementById('lista-jogadores');
    if (!tbody) return;
    
    const jogadoresFiltrados = filtrarJogadores();
    
    if (jogadoresFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum jogador encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = jogadoresFiltrados.map(jogador => {
        const jaEscalado = verificarJogadorEscalado(jogador.id);
        const statusClass = `status-${jogador.status}`;
        const variacaoClass = jogador.variacao >= 0 ? 'valorization-up' : 'valorization-down';
        const variacaoIcon = jogador.variacao >= 0 ? '↑' : '↓';
        
        return `
            <tr class="player-row ${jaEscalado ? 'opacity-50' : ''}">
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <img src="${jogador.photo_url || getDefaultAvatar()}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                                 alt="${jogador.name}">
                            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getCorCirculo(jogador.position)} border-2 border-white flex items-center justify-center">
                                <span class="text-[8px] font-bold text-white">${jogador.position}</span>
                            </div>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900 dark:text-white">${jogador.name}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                ${jogador.team?.logo_url ? `<img src="${jogador.team.logo_url}" class="w-4 h-4">` : ''}
                                ${jogador.team?.name || 'Sem time'}
                            </div>
                        </div>
                    </div>
                </td>
                
                <td class="px-4 py-3 text-center">
                    <span class="status-badge ${statusClass}" title="${getStatusText(jogador.status)}"></span>
                </td>
                
                <td class="px-4 py-3 text-center">
                    <div class="font-bold text-gray-900 dark:text-white">
                        C$ ${jogador.price.toFixed(2)}
                    </div>
                </td>
                
                <td class="px-4 py-3 text-center">
                    <div class="${variacaoClass} font-bold flex items-center justify-center gap-1">
                        <span>${variacaoIcon}</span>
                        <span>${Math.abs(jogador.variacao).toFixed(2)}</span>
                    </div>
                </td>
                
                <td class="px-4 py-3 text-center">
                    <div class="font-semibold ${jogador.pontos_ultima > 5 ? 'text-green-600' : jogador.pontos_ultima < 0 ? 'text-red-600' : 'text-gray-600'}">
                        ${jogador.pontos_ultima.toFixed(1)}
                    </div>
                </td>
                
                <td class="px-4 py-3 text-center">
                    <div class="text-gray-700 dark:text-gray-300 font-medium">
                        ${jogador.media_pontos.toFixed(1)}
                    </div>
                </td>
                
                <td class="px-4 py-3 text-center">
                    <div class="text-xs">
                        <div class="flex items-center justify-center gap-1">
                            <img src="${jogador.confronto.casa_logo}" class="w-5 h-5" title="${jogador.confronto.casa}">
                            <span class="text-gray-400">X</span>
                            <img src="${jogador.confronto.fora_logo}" class="w-5 h-5" title="${jogador.confronto.fora}">
                        </div>
                    </div>
                </td>
                
                <td class="px-4 py-3 text-center">
                    ${jaEscalado ? `
                        <button disabled class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg font-semibold text-sm cursor-not-allowed">
                            ✓ Escalado
                        </button>
                    ` : `
                        <button onclick="escalarJogador(${jogador.id})" class="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold text-sm transition-all">
                            + Escalar
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// RENDERIZAÇÃO DA ESCALAÇÃO (CAMPO 3D)
// ============================================

function renderizarEscalacao() {
    renderizarPosicao('GOL', 'slot-gol');
    renderizarPosicao('FIX', 'slot-fix');
    renderizarPosicao('PIV', 'slot-piv');
    renderizarPosicaoALA();
}

function renderizarPosicao(posicao, slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    
    const jogador = escalacaoAtual[posicao];
    
    if (jogador) {
        const variacaoClass = (jogador.variacao || 0) >= 0 ? 'text-green-400' : 'text-red-400';
        const variacaoIcon = (jogador.variacao || 0) >= 0 ? '↑' : '↓';
        
        slot.innerHTML = `
            <div class="player-slot" onclick="removerJogador('${posicao}')">
                <div class="player-avatar">
                    <img src="${jogador.photo_url || getDefaultAvatar()}" alt="${jogador.name}">
                    <div class="position-badge">${posicao}</div>
                </div>
                <div class="text-center mt-2">
                    <div class="text-xs text-white font-semibold bg-black/50 rounded px-2 py-1 max-w-[80px] truncate">
                        ${jogador.name.split(' ')[0]}
                    </div>
                    <div class="text-xs ${variacaoClass} font-bold mt-1">
                        ${variacaoIcon} ${Math.abs(jogador.variacao || 0).toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    } else {
        const emoji = {
            'GOL': '🧤',
            'FIX': '🛡️',
            'PIV': '🎯'
        }[posicao];
        
        slot.innerHTML = `
            <div class="player-slot" onclick="abrirMercado('${posicao}')">
                <div class="player-avatar">
                    <span class="text-3xl">${emoji}</span>
                    <div class="position-badge">${posicao}</div>
                </div>
                <div class="text-center mt-2">
                    <div class="text-xs text-white font-semibold bg-black/30 rounded px-2 py-1">Vazio</div>
                </div>
            </div>
        `;
    }
}

function renderizarPosicaoALA() {
    ['slot-ala-1', 'slot-ala-2'].forEach((slotId, index) => {
        const slot = document.getElementById(slotId);
        if (!slot) return;
        
        const jogador = escalacaoAtual.ALA[index];
        
        if (jogador) {
            const variacaoClass = (jogador.variacao || 0) >= 0 ? 'text-green-400' : 'text-red-400';
            const variacaoIcon = (jogador.variacao || 0) >= 0 ? '↑' : '↓';
            
            slot.innerHTML = `
                <div class="player-slot" onclick="removerJogador('ALA', ${index})">
                    <div class="player-avatar">
                        <img src="${jogador.photo_url || getDefaultAvatar()}" alt="${jogador.name}">
                        <div class="position-badge">ALA</div>
                    </div>
                    <div class="text-center mt-2">
                        <div class="text-xs text-white font-semibold bg-black/50 rounded px-2 py-1 max-w-[80px] truncate">
                            ${jogador.name.split(' ')[0]}
                        </div>
                        <div class="text-xs ${variacaoClass} font-bold mt-1">
                            ${variacaoIcon} ${Math.abs(jogador.variacao || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        } else {
            slot.innerHTML = `
                <div class="player-slot" onclick="abrirMercado('ALA')">
                    <div class="player-avatar">
                        <span class="text-3xl">🏃</span>
                        <div class="position-badge">ALA</div>
                    </div>
                    <div class="text-center mt-2">
                        <div class="text-xs text-white font-semibold bg-black/30 rounded px-2 py-1">Vazio</div>
                    </div>
                </div>
            `;
        }
    });
}

// ============================================
// LÓGICA DE ESCALAÇÃO
// ============================================

function escalarJogador(jogadorId) {
    const jogador = jogadoresDisponiveis.find(j => j.id === jogadorId);
    if (!jogador) return;
    
    if (verificarJogadorEscalado(jogadorId)) {
        showError('Jogador já está escalado');
        return;
    }
    
    if (calcularCustoEscalacao() + jogador.price > saldoAtual) {
        showError('Saldo insuficiente!');
        return;
    }
    
    if (!adicionarJogadorNaEscalacao(jogador)) {
        return;
    }
    
    renderizarJogadores();
    renderizarEscalacao();
    atualizarDisplays();
    showSuccess(`${jogador.name} escalado!`);
}

function adicionarJogadorNaEscalacao(jogador) {
    const posicao = jogador.position;
    
    if (posicao === 'GOL') {
        if (escalacaoAtual.GOL) {
            showWarning('Já há um goleiro escalado');
            return false;
        }
        escalacaoAtual.GOL = jogador;
    } else if (posicao === 'FIX') {
        if (escalacaoAtual.FIX) {
            showWarning('Já há um fixo escalado');
            return false;
        }
        escalacaoAtual.FIX = jogador;
    } else if (posicao === 'PIV') {
        if (escalacaoAtual.PIV) {
            showWarning('Já há um pivô escalado');
            return false;
        }
        escalacaoAtual.PIV = jogador;
    } else if (posicao === 'ALA') {
        const indiceVazio = escalacaoAtual.ALA.findIndex(j => j === null);
        if (indiceVazio === -1) {
            showWarning('Já há 2 alas escalados');
            return false;
        }
        escalacaoAtual.ALA[indiceVazio] = jogador;
    }
    
    return true;
}

function removerJogador(posicao, indice = null) {
    if (posicao === 'ALA' && indice !== null) {
        if (escalacaoAtual.ALA[indice]) {
            const jogador = escalacaoAtual.ALA[indice];
            escalacaoAtual.ALA[indice] = null;
            showInfo(`${jogador.name} removido`);
        }
    } else {
        if (escalacaoAtual[posicao]) {
            const jogador = escalacaoAtual[posicao];
            escalacaoAtual[posicao] = null;
            showInfo(`${jogador.name} removido`);
        }
    }
    
    renderizarJogadores();
    renderizarEscalacao();
    atualizarDisplays();
}

function limparEscalacao() {
    if (!confirm('Limpar toda a escalação?')) return;
    
    resetarEscalacao();
    renderizarJogadores();
    renderizarEscalacao();
    atualizarDisplays();
    showSuccess('Escalação limpa!');
}

function resetarEscalacao() {
    escalacaoAtual = {
        'GOL': null,
        'FIX': null,
        'ALA': [null, null],
        'PIV': null
    };
}

// ============================================
// DISPLAYS E ATUALIZAÇÃO
// ============================================

function atualizarDisplays() {
    const custo = calcularCustoEscalacao();
    const restante = saldoAtual - custo;
    const total = calcularTotalJogadores();
    
    const elementPrecoTime = document.getElementById('preco-time');
    if (elementPrecoTime) {
        elementPrecoTime.textContent = `C$ ${custo.toFixed(2)}`;
    }
    
    const elementSaldo = document.getElementById('saldo-atual');
    if (elementSaldo) {
        elementSaldo.textContent = `C$ ${saldoAtual.toFixed(2)}`;
    }
    
    const elementGasto = document.getElementById('valor-gasto');
    if (elementGasto) {
        elementGasto.textContent = `C$ ${custo.toFixed(2)}`;
    }
    
    const elementRestante = document.getElementById('saldo-restante');
    if (elementRestante) {
        elementRestante.textContent = `C$ ${restante.toFixed(2)}`;
        elementRestante.className = restante >= 0 ? 'text-2xl font-black text-blue-600 dark:text-blue-400' : 'text-2xl font-black text-red-600 dark:text-red-400';
    }
    
    const elementTotal = document.getElementById('total-jogadores');
    if (elementTotal) {
        elementTotal.textContent = `${total}/5`;
    }
    
    const elementFaltando = document.getElementById('posicoes-faltando');
    if (elementFaltando) {
        elementFaltando.textContent = 5 - total;
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

function filtrarJogadores() {
    const busca = document.getElementById('busca-jogador')?.value.toLowerCase() || '';
    const posicao = document.getElementById('filtro-posicao')?.value || '';
    
    return jogadoresDisponiveis.filter(jogador => {
        const matchBusca = jogador.name.toLowerCase().includes(busca);
        const matchPosicao = !posicao || jogador.position === posicao;
        return matchBusca && matchPosicao;
    });
}

function verificarJogadorEscalado(jogadorId) {
    if (escalacaoAtual.GOL?.id === jogadorId) return true;
    if (escalacaoAtual.FIX?.id === jogadorId) return true;
    if (escalacaoAtual.PIV?.id === jogadorId) return true;
    if (escalacaoAtual.ALA.some(j => j?.id === jogadorId)) return true;
    return false;
}

function calcularTotalJogadores() {
    let total = 0;
    if (escalacaoAtual.GOL) total++;
    if (escalacaoAtual.FIX) total++;
    if (escalacaoAtual.PIV) total++;
    total += escalacaoAtual.ALA.filter(j => j !== null).length;
    return total;
}

function calcularCustoEscalacao() {
    let custo = 0;
    if (escalacaoAtual.GOL) custo += escalacaoAtual.GOL.price;
    if (escalacaoAtual.FIX) custo += escalacaoAtual.FIX.price;
    if (escalacaoAtual.PIV) custo += escalacaoAtual.PIV.price;
    escalacaoAtual.ALA.forEach(jogador => {
        if (jogador) custo += jogador.price;
    });
    return custo;
}

function configurarFiltros() {
    const busca = document.getElementById('busca-jogador');
    const filtroPosicao = document.getElementById('filtro-posicao');
    
    if (busca) busca.addEventListener('input', renderizarJogadores);
    if (filtroPosicao) filtroPosicao.addEventListener('change', renderizarJogadores);
}

function abrirMercado(posicao) {
    const filtroPosicao = document.getElementById('filtro-posicao');
    if (filtroPosicao) {
        filtroPosicao.value = posicao;
        renderizarJogadores();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// DADOS SIMULADOS
// ============================================

function getRandomStatus() {
    const statuses = ['provavel', 'provavel', 'provavel', 'duvida', 'contundido'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

function getRandomVariacao() {
    return (Math.random() * 4 - 2).toFixed(2);
}

function getRandomPontos() {
    return (Math.random() * 20 - 5).toFixed(1);
}

function getRandomMedia() {
    return (Math.random() * 12).toFixed(1);
}

function getRandomJogos() {
    return Math.floor(Math.random() * 10) + 1;
}

function getRandomConfronto() {
    const times = ['Magnus', 'Pato', 'Corinthians', 'Joinville'];
    const casa = times[Math.floor(Math.random() * times.length)];
    let fora = times[Math.floor(Math.random() * times.length)];
    while (fora === casa) fora = times[Math.floor(Math.random() * times.length)];
    
    return {
        casa,
        fora,
        casa_logo: getDefaultTeamLogo(),
        fora_logo: getDefaultTeamLogo()
    };
}

function getDefaultAvatar() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";
}

function getDefaultTeamLogo() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.3em'%3E⚽%3C/text%3E%3C/svg%3E";
}

function getCorCirculo(posicao) {
    const cores = {
        'GOL': 'bg-yellow-500',
        'FIX': 'bg-blue-500',
        'ALA': 'bg-green-500',
        'PIV': 'bg-red-500'
    };
    return cores[posicao] || 'bg-gray-500';
}

function getStatusText(status) {
    const textos = {
        'provavel': 'Provável',
        'duvida': 'Dúvida',
        'contundido': 'Contundido'
    };
    return textos[status] || 'Desconhecido';
}

// ============================================
// SALVAR ESCALAÇÃO
// ============================================

async function salvarEscalacao() {
    const total = calcularTotalJogadores();
    
    if (total !== 5) {
        showError('Complete a escalação (5 jogadores)');
        return;
    }
    
    if (!escalacaoAtual.GOL || !escalacaoAtual.FIX || !escalacaoAtual.PIV || 
        escalacaoAtual.ALA.filter(j => j).length !== 2) {
        showError('Formação inválida (1 GOL, 1 FIX, 2 ALA, 1 PIV)');
        return;
    }
    
    try {
        const { data: rodadaPendente, error: errorRodada } = await supabase
            .from('rounds')
            .select('id')
            .eq('status', 'pending')
            .single();
        
        if (errorRodada || !rodadaPendente) {
            showError('Nenhuma rodada disponível');
            return;
        }
        
        const { data: escalacaoExistente } = await supabase
            .from('lineups')
            .select('id')
            .eq('user_id', usuarioLogado.id)
            .eq('round_id', rodadaPendente.id)
            .single();
        
        let lineupId;
        
        if (escalacaoExistente) {
            lineupId = escalacaoExistente.id;
            await supabase.from('lineup_players').delete().eq('lineup_id', lineupId);
        } else {
            const { data: novaEscalacao, error: errorEscalacao } = await supabase
                .from('lineups')
                .insert({
                    user_id: usuarioLogado.id,
                    round_id: rodadaPendente.id,
                    total_points: 0
                })
                .select('id')
                .single();
            
            if (errorEscalacao) throw errorEscalacao;
            lineupId = novaEscalacao.id;
        }
        
        const jogadoresParaInserir = [];
        
        if (escalacaoAtual.GOL) jogadoresParaInserir.push({lineup_id: lineupId, player_id: escalacaoAtual.GOL.id, is_starter: true, points: 0});
        if (escalacaoAtual.FIX) jogadoresParaInserir.push({lineup_id: lineupId, player_id: escalacaoAtual.FIX.id, is_starter: true, points: 0});
        if (escalacaoAtual.PIV) jogadoresParaInserir.push({lineup_id: lineupId, player_id: escalacaoAtual.PIV.id, is_starter: true, points: 0});
        escalacaoAtual.ALA.forEach(jogador => {
            if (jogador) jogadoresParaInserir.push({lineup_id: lineupId, player_id: jogador.id, is_starter: true, points: 0});
        });
        
        const { error: errorJogadores } = await supabase
            .from('lineup_players')
            .insert(jogadoresParaInserir);
        
        if (errorJogadores) throw errorJogadores;
        
        showSuccess('Escalação salva com sucesso!');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showError('Erro ao salvar escalação');
    }
}

async function verificarStatusMercado() {
    try {
        const { data: todasRodadas } = await supabase.from('rounds').select('id, name, status');
        const rodadaAtiva = todasRodadas?.find(r => r.status === 'active');
        mercadoAberto = !rodadaAtiva;
        return mercadoAberto;
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        return true;
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function showSuccess(msg) {
    showNotification(msg, 'success');
}

function showError(msg) {
    showNotification(msg, 'error');
}

function showWarning(msg) {
    showNotification(msg, 'warning');
}

function showInfo(msg) {
    showNotification(msg, 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.escalarJogador = escalarJogador;
window.removerJogador = removerJogador;
window.limparEscalacao = limparEscalacao;
window.salvarEscalacao = salvarEscalacao;
window.abrirMercado = abrirMercado;

console.log('✅ Mercado Cartola LNF Fantasy carregado ⚽');