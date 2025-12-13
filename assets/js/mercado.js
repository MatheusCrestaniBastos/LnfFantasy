// ============================================
// LNF FANTASY - MERCADO CARTOLA (DEBUG)
// ============================================

console.log('🚀 INICIANDO MERCADO CARTOLA');

let usuarioLogado = null;
let todosJogadores = [];
let meuTime = {
    GOL: null,
    FIX: null,
    ALA: [null, null],
    PIV: null
};
let saldo = 100.00;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM CARREGADO');
    
    try {
        // Verificar Supabase
        if (typeof supabase === 'undefined') {
            console.error('❌ SUPABASE NÃO ENCONTRADO!');
            alert('ERRO: Supabase não carregado. Verifique config.js');
            return;
        }
        console.log('✅ Supabase disponível');
        
        // Verificar autenticação
        console.log('🔐 Verificando autenticação...');
        usuarioLogado = await verificarAuth();
        if (!usuarioLogado) {
            console.error('❌ NÃO AUTENTICADO');
            window.location.href = 'index.html';
            return;
        }
        console.log('✅ Usuário logado:', usuarioLogado.email);
        
        // Carregar saldo
        console.log('💰 Carregando saldo...');
        await carregarSaldo();
        console.log('✅ Saldo:', saldo);
        
        // Carregar jogadores - TENTAR 3 MÉTODOS
        console.log('📥 Carregando jogadores...');
        await carregarJogadoresComDebug();
        
        // Carregar time atual
        console.log('⚽ Carregando time atual...');
        await carregarTimeAtual();
        
        // Preencher filtros
        console.log('🔍 Preenchendo filtros...');
        preencherFiltroTimes();
        
        // Atualizar displays
        console.log('🎨 Atualizando displays...');
        atualizarTodosDisplays();
        
        console.log('✅ INICIALIZAÇÃO COMPLETA!');
        
    } catch (error) {
        console.error('❌ ERRO FATAL NA INICIALIZAÇÃO:', error);
        alert('ERRO FATAL: ' + error.message);
    }
});

// ============================================
// CARREGAR JOGADORES COM DEBUG
// ============================================

async function carregarJogadoresComDebug() {
    console.log('═══════════════════════════════════');
    console.log('CARREGANDO JOGADORES - MÉTODO 1');
    console.log('═══════════════════════════════════');
    
    try {
        // MÉTODO 1: Query com relacionamento
        console.log('Tentando query com relacionamento...');
        const { data: data1, error: error1 } = await supabase
            .from('players')
            .select(`
                id,
                name,
                position,
                price,
                photo_url,
                team_id,
                teams (
                    id,
                    name,
                    logo_url
                )
            `)
            .order('name');
        
        console.log('RESULTADO MÉTODO 1:');
        console.log('- Error:', error1);
        console.log('- Data:', data1);
        console.log('- Quantidade:', data1?.length);
        
        if (!error1 && data1 && data1.length > 0) {
            console.log('✅ MÉTODO 1 FUNCIONOU!');
            console.log('Primeiro jogador:', data1[0]);
            processarJogadores(data1);
            return;
        }
        
    } catch (err) {
        console.error('❌ MÉTODO 1 FALHOU:', err);
    }
    
    // MÉTODO 2: Query simples sem relacionamento
    console.log('═══════════════════════════════════');
    console.log('MÉTODO 2: Query simples');
    console.log('═══════════════════════════════════');
    
    try {
        const { data: data2, error: error2 } = await supabase
            .from('players')
            .select('*')
            .order('name');
        
        console.log('RESULTADO MÉTODO 2:');
        console.log('- Error:', error2);
        console.log('- Data:', data2);
        console.log('- Quantidade:', data2?.length);
        
        if (!error2 && data2 && data2.length > 0) {
            console.log('✅ MÉTODO 2 FUNCIONOU!');
            console.log('Primeiro jogador:', data2[0]);
            
            // Carregar times separadamente
            const { data: times } = await supabase.from('teams').select('*');
            console.log('Times carregados:', times?.length);
            
            // Mapear jogadores com times
            const jogadoresComTimes = data2.map(j => {
                const time = times?.find(t => t.id === j.team_id);
                return {
                    ...j,
                    team: time ? {
                        id: time.id,
                        name: time.name,
                        logo_url: time.logo_url
                    } : null
                };
            });
            
            processarJogadores(jogadoresComTimes);
            return;
        }
        
    } catch (err) {
        console.error('❌ MÉTODO 2 FALHOU:', err);
    }
    
    // MÉTODO 3: Verificar se tabela existe
    console.log('═══════════════════════════════════');
    console.log('MÉTODO 3: Verificar tabela');
    console.log('═══════════════════════════════════');
    
    try {
        const { count, error: error3 } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true });
        
        console.log('RESULTADO MÉTODO 3:');
        console.log('- Error:', error3);
        console.log('- Count:', count);
        
        if (error3) {
            console.error('❌ ERRO NA TABELA:', error3);
            mostrarErro('Tabela "players" não encontrada ou erro de permissão: ' + error3.message);
            return;
        }
        
        if (count === 0) {
            console.warn('⚠️ TABELA VAZIA!');
            mostrarMensagemVazia();
            return;
        }
        
    } catch (err) {
        console.error('❌ MÉTODO 3 FALHOU:', err);
    }
    
    console.error('❌ TODOS OS MÉTODOS FALHARAM');
    mostrarErro('Não foi possível carregar jogadores. Verifique o console.');
}

// ============================================
// PROCESSAR JOGADORES
// ============================================

function processarJogadores(data) {
    console.log('📊 PROCESSANDO', data.length, 'JOGADORES');
    
    todosJogadores = data.map((j, index) => {
        const jogador = {
            id: j.id,
            name: j.name,
            position: j.position,
            price: j.price || 5.00,
            photo_url: j.photo_url,
            team_id: j.team_id,
            team: j.teams ? {
                id: j.teams.id,
                name: j.teams.name,
                logo_url: j.teams.logo_url
            } : j.team ? j.team : null,
            variacao: ((Math.random() - 0.5) * 2).toFixed(2),
            media: (Math.random() * 10).toFixed(1)
        };
        
        if (index < 3) {
            console.log(`Jogador ${index + 1}:`, jogador);
        }
        
        return jogador;
    });
    
    console.log('✅ JOGADORES PROCESSADOS:', todosJogadores.length);
    
    // Renderizar
    renderizarJogadores(todosJogadores);
}

// ============================================
// VERIFICAR AUTH
// ============================================

async function verificarAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            console.log('❌ Não autenticado');
            return null;
        }
        
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (userError || !userData) {
            console.error('❌ Erro ao carregar dados do usuário:', userError);
            return null;
        }
        
        return userData;
        
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        return null;
    }
}

// ============================================
// CARREGAR SALDO
// ============================================

async function carregarSaldo() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('cartoletas')
            .eq('id', usuarioLogado.id)
            .single();
        
        if (error) {
            console.error('❌ Erro ao carregar saldo:', error);
            saldo = 100.00;
            return;
        }
        
        saldo = data.cartoletas || 100.00;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        saldo = 100.00;
    }
}

// ============================================
// RENDERIZAR JOGADORES
// ============================================

function renderizarJogadores(jogadores) {
    console.log('🎨 RENDERIZANDO', jogadores.length, 'JOGADORES');
    
    const lista = document.getElementById('lista-jogadores');
    
    if (!lista) {
        console.error('❌ ELEMENTO lista-jogadores NÃO ENCONTRADO!');
        return;
    }
    
    if (!jogadores || jogadores.length === 0) {
        console.warn('⚠️ Nenhum jogador para renderizar');
        lista.innerHTML = `
            <div style="padding: 60px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">⚽</div>
                <p style="color: #999; font-size: 16px; margin-bottom: 8px;">Nenhum jogador cadastrado</p>
                <p style="color: #999; font-size: 14px;">Use o painel admin para importar jogadores</p>
            </div>
        `;
        return;
    }
    
    const imgPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";
    const logoPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='20' text-anchor='middle' dy='.3em'%3E⚽%3C/text%3E%3C/svg%3E";
    
    const html = jogadores.map(j => {
        const escalado = isJogadorEscalado(j.id);
        const semSaldo = !escalado && (calcularGasto() + j.price > saldo);
        
        return `
            <div class="player-row" style="padding: 12px 20px; display: grid; grid-template-columns: 50px 80px 200px 80px 80px 80px 80px 100px 80px; gap: 12px; align-items: center;">
                
                <!-- FOTO -->
                <div>
                    <img src="${j.photo_url || imgPlaceholder}" 
                         style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e0e0e0;"
                         onerror="this.src='${imgPlaceholder}'">
                </div>
                
                <!-- TIME -->
                <div style="text-align: center;">
                    <img src="${j.team?.logo_url || logoPlaceholder}" 
                         style="width: 32px; height: 32px; object-fit: contain;"
                         onerror="this.src='${logoPlaceholder}'"
                         title="${j.team?.name || 'Sem time'}">
                </div>
                
                <!-- JOGADOR -->
                <div>
                    <div style="font-weight: 600; font-size: 14px; color: #333; margin-bottom: 2px;">${j.name}</div>
                    <div style="font-size: 11px; color: #999;">${j.team?.name || 'Sem time'}</div>
                </div>
                
                <!-- STATUS (Posição) -->
                <div style="text-align: center;">
                    <span style="background: ${getCorPosicao(j.position)}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                        ${j.position}
                    </span>
                </div>
                
                <!-- PREÇO -->
                <div style="text-align: right;">
                    <span style="font-weight: 700; font-size: 14px; color: #333;">C$ ${j.price.toFixed(2)}</span>
                </div>
                
                <!-- VARIAÇÃO -->
                <div style="text-align: center;">
                    <span class="${j.variacao >= 0 ? 'variacao-positiva' : 'variacao-negativa'}">
                        ${j.variacao >= 0 ? '↑' : '↓'} ${Math.abs(j.variacao).toFixed(2)}
                    </span>
                </div>
                
                <!-- MÉDIA -->
                <div style="text-align: center;">
                    <span style="font-weight: 600; font-size: 14px; color: #333;">${j.media}</span>
                </div>
                
                <!-- STATUS -->
                <div style="text-align: center; font-size: 11px; color: #999;">
                    ${escalado ? '✓ Escalado' : semSaldo ? '💰 Sem saldo' : '-'}
                </div>
                
                <!-- BOTÃO -->
                <div style="text-align: center;">
                    ${escalado ? `
                        <button class="btn-comprar" disabled style="background: #999;">
                            ESCALADO
                        </button>
                    ` : semSaldo ? `
                        <button class="btn-comprar" disabled style="background: #ccc;">
                            SEM SALDO
                        </button>
                    ` : `
                        <button class="btn-comprar" onclick="escalarJogador(${j.id})">
                            COMPRAR
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    lista.innerHTML = html;
    console.log('✅ RENDERIZAÇÃO COMPLETA');
}

function getCorPosicao(pos) {
    const cores = {
        'GOL': '#ffc107',
        'FIX': '#2196F3',
        'ALA': '#4CAF50',
        'PIV': '#f44336'
    };
    return cores[pos] || '#999';
}

// ============================================
// FILTROS
// ============================================

function preencherFiltroTimes() {
    const select = document.getElementById('filtro-time');
    if (!select) return;
    
    const times = [...new Set(todosJogadores.map(j => j.team?.name).filter(Boolean))];
    times.sort();
    
    select.innerHTML = '<option value="">Todos</option>' + 
        times.map(t => `<option value="${t}">${t}</option>`).join('');
}

function filtrarJogadores() {
    const posicao = document.getElementById('filtro-posicao')?.value || '';
    const time = document.getElementById('filtro-time')?.value || '';
    const busca = document.getElementById('filtro-busca')?.value.toLowerCase() || '';
    
    const filtrados = todosJogadores.filter(j => {
        const matchPos = !posicao || j.position === posicao;
        const matchTime = !time || j.team?.name === time;
        const matchBusca = !busca || j.name.toLowerCase().includes(busca);
        return matchPos && matchTime && matchBusca;
    });
    
    console.log('🔍 Filtrados:', filtrados.length, 'de', todosJogadores.length);
    renderizarJogadores(filtrados);
}

// ============================================
// ESCALAR JOGADOR
// ============================================

function escalarJogador(jogadorId) {
    console.log('➕ Escalando jogador ID:', jogadorId);
    
    const jogador = todosJogadores.find(j => j.id === jogadorId);
    if (!jogador) {
        console.error('❌ Jogador não encontrado:', jogadorId);
        return;
    }
    
    if (calcularGasto() + jogador.price > saldo) {
        alert('💰 Saldo insuficiente!');
        return;
    }
    
    const pos = jogador.position;
    
    if (pos === 'GOL') {
        if (meuTime.GOL) {
            alert('⚠️ Já há um goleiro escalado');
            return;
        }
        meuTime.GOL = jogador;
    } else if (pos === 'FIX') {
        if (meuTime.FIX) {
            alert('⚠️ Já há um fixo escalado');
            return;
        }
        meuTime.FIX = jogador;
    } else if (pos === 'PIV') {
        if (meuTime.PIV) {
            alert('⚠️ Já há um pivô escalado');
            return;
        }
        meuTime.PIV = jogador;
    } else if (pos === 'ALA') {
        const idx = meuTime.ALA.findIndex(a => a === null);
        if (idx === -1) {
            alert('⚠️ Já há 2 alas escalados');
            return;
        }
        meuTime.ALA[idx] = jogador;
    }
    
    console.log('✅ Jogador escalado:', jogador.name);
    atualizarTodosDisplays();
    renderizarJogadores(todosJogadores);
}

function removerJogador(pos, idx = null) {
    console.log('➖ Removendo jogador:', pos, idx);
    
    if (pos === 'ALA') {
        meuTime.ALA[idx] = null;
    } else {
        meuTime[pos] = null;
    }
    
    atualizarTodosDisplays();
    renderizarJogadores(todosJogadores);
}

// ============================================
// CALCULAR
// ============================================

function calcularGasto() {
    let total = 0;
    if (meuTime.GOL) total += meuTime.GOL.price;
    if (meuTime.FIX) total += meuTime.FIX.price;
    if (meuTime.PIV) total += meuTime.PIV.price;
    meuTime.ALA.forEach(a => { if (a) total += a.price; });
    return total;
}

function contarJogadores() {
    let total = 0;
    if (meuTime.GOL) total++;
    if (meuTime.FIX) total++;
    if (meuTime.PIV) total++;
    total += meuTime.ALA.filter(a => a !== null).length;
    return total;
}

function isJogadorEscalado(id) {
    if (meuTime.GOL?.id === id) return true;
    if (meuTime.FIX?.id === id) return true;
    if (meuTime.PIV?.id === id) return true;
    if (meuTime.ALA.some(a => a?.id === id)) return true;
    return false;
}

// ============================================
// ATUALIZAR DISPLAYS
// ============================================

function atualizarTodosDisplays() {
    const gasto = calcularGasto();
    const restante = saldo - gasto;
    const total = contarJogadores();
    
    document.getElementById('saldo-disponivel').textContent = `C$ ${saldo.toFixed(2)}`;
    document.getElementById('saldo-gasto').textContent = `C$ ${gasto.toFixed(2)}`;
    document.getElementById('saldo-restante').textContent = `C$ ${restante.toFixed(2)}`;
    document.getElementById('preco-time-header').textContent = `C$ ${gasto.toFixed(2)}`;
    document.getElementById('resumo-escalacao').textContent = `${total}/5 jogadores escalados`;
    
    renderSlot('slot-gol', meuTime.GOL, 'GOL');
    renderSlot('slot-fix', meuTime.FIX, 'FIX');
    renderSlot('slot-piv', meuTime.PIV, 'PIV');
    renderSlot('slot-ala1', meuTime.ALA[0], 'ALA', 0);
    renderSlot('slot-ala2', meuTime.ALA[1], 'ALA', 1);
}

function renderSlot(slotId, jogador, pos, idx = null) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    
    if (jogador) {
        slot.className = 'player-slot filled';
        slot.innerHTML = `
            <div style="width: 100%;">
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">${jogador.name}</div>
                <div style="font-size: 10px; color: #666; margin-bottom: 6px;">${jogador.team?.name || ''}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; font-size: 12px; color: #28a745;">C$ ${jogador.price.toFixed(2)}</span>
                    <button onclick="removerJogador('${pos}', ${idx})" style="background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;">
                        ✕
                    </button>
                </div>
            </div>
        `;
    } else {
        slot.className = 'player-slot';
        slot.innerHTML = `<span style="opacity: 0.6;">${pos}</span>`;
    }
}

// ============================================
// SALVAR E LIMPAR
// ============================================

async function salvarTime() {
    console.log('💾 Salvando time...');
    
    const total = contarJogadores();
    
    if (total !== 5) {
        alert('⚠️ Você precisa escalar 5 jogadores (1 GOL, 1 FIX, 2 ALA, 1 PIV)');
        return;
    }
    
    try {
        const { data: rodada } = await supabase.from('rounds').select('id').eq('status', 'pending').single();
        if (!rodada) {
            alert('⚠️ Nenhuma rodada disponível');
            return;
        }
        
        const { data: lineupExistente } = await supabase.from('lineups').select('id').eq('user_id', usuarioLogado.id).eq('round_id', rodada.id).single();
        
        let lineupId;
        
        if (lineupExistente) {
            lineupId = lineupExistente.id;
            await supabase.from('lineup_players').delete().eq('lineup_id', lineupId);
        } else {
            const { data: novaLineup } = await supabase.from('lineups').insert({ user_id: usuarioLogado.id, round_id: rodada.id, total_points: 0 }).select('id').single();
            lineupId = novaLineup.id;
        }
        
        const jogadores = [];
        if (meuTime.GOL) jogadores.push({ lineup_id: lineupId, player_id: meuTime.GOL.id, is_starter: true, points: 0 });
        if (meuTime.FIX) jogadores.push({ lineup_id: lineupId, player_id: meuTime.FIX.id, is_starter: true, points: 0 });
        if (meuTime.PIV) jogadores.push({ lineup_id: lineupId, player_id: meuTime.PIV.id, is_starter: true, points: 0 });
        meuTime.ALA.forEach(a => { if (a) jogadores.push({ lineup_id: lineupId, player_id: a.id, is_starter: true, points: 0 }); });
        
        await supabase.from('lineup_players').insert(jogadores);
        
        const novoSaldo = saldo - calcularGasto();
        await supabase.from('users').update({ cartoletas: novoSaldo }).eq('id', usuarioLogado.id);
        
        alert('✅ Time salvo com sucesso!');
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('❌ Erro: ' + error.message);
    }
}

function limparTime() {
    if (!confirm('Limpar escalação?')) return;
    meuTime = { GOL: null, FIX: null, ALA: [null, null], PIV: null };
    atualizarTodosDisplays();
    renderizarJogadores(todosJogadores);
}

async function carregarTimeAtual() {
    try {
        const { data: rodadas } = await supabase.from('rounds').select('id, status');
        const rodadaPendente = rodadas?.find(r => r.status === 'pending');
        if (!rodadaPendente) return;
        
        const { data: escalacoes } = await supabase.from('lineups').select('id, user_id, round_id');
        const minhaEscalacao = escalacoes?.find(e => e.user_id === usuarioLogado.id && e.round_id === rodadaPendente.id);
        if (!minhaEscalacao) return;
        
        const { data: jogadores } = await supabase.from('lineup_players').select(`player_id, players (id, name, position, price, photo_url, team_id, teams(name, logo_url))`).eq('lineup_id', minhaEscalacao.id);
        if (!jogadores) return;
        
        jogadores.forEach(lp => {
            const j = lp.players;
            if (j.position === 'GOL') meuTime.GOL = j;
            else if (j.position === 'FIX') meuTime.FIX = j;
            else if (j.position === 'PIV') meuTime.PIV = j;
            else if (j.position === 'ALA') {
                const idx = meuTime.ALA.findIndex(a => a === null);
                if (idx !== -1) meuTime.ALA[idx] = j;
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar time:', error);
    }
}

function mostrarErro(msg) {
    const lista = document.getElementById('lista-jogadores');
    if (!lista) return;
    lista.innerHTML = `
        <div style="padding: 60px 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px; color: #dc3545;">⚠️</div>
            <p style="color: #dc3545; font-size: 16px; margin-bottom: 8px;">ERRO</p>
            <p style="color: #999; font-size: 14px;">${msg}</p>
            <p style="color: #999; font-size: 12px; margin-top: 12px;">Abra o Console (F12) para mais detalhes</p>
        </div>
    `;
}

function mostrarMensagemVazia() {
    const lista = document.getElementById('lista-jogadores');
    if (!lista) return;
    lista.innerHTML = `
        <div style="padding: 60px 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚽</div>
            <p style="color: #999; font-size: 16px; margin-bottom: 8px;">Nenhum jogador cadastrado</p>
            <p style="color: #999; font-size: 14px;">Use o painel admin para importar jogadores</p>
        </div>
    `;
}

// Exportar
window.escalarJogador = escalarJogador;
window.removerJogador = removerJogador;
window.salvarTime = salvarTime;
window.limparTime = limparTime;
window.filtrarJogadores = filtrarJogadores;

console.log('✅ MERCADO CARTOLA CARREGADO');