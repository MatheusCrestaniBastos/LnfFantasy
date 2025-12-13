// ============================================
// LNF FANTASY - DASHBOARD
// ============================================

let currentUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await auth.requireAuth();
    
    if (!currentUser) return;

    // Mostrar nome do time
    document.getElementById('user-team-name').textContent = currentUser.team_name;

    // Carregar dados
    await Promise.all([
        loadUserStats(),
        loadMyTeam(),
        loadRanking()
    ]);
});

// Carregar estatísticas do usuário
async function loadUserStats() {
    try {
        // Atualizar pontos e cartoletas
        const { data: userData } = await supabase
            .from('users')
            .select('total_points, cartoletas')
            .eq('id', currentUser.id)
            .single();

        if (userData) {
            document.getElementById('user-points').textContent = userData.total_points || 0;
            document.getElementById('user-cartoletas').textContent = `C$ ${userData.cartoletas.toFixed(2)}`;
        }

        // Contar rodadas participadas
        const { count } = await supabase
            .from('lineups')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);

        document.getElementById('user-rounds').textContent = count || 0;

    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// Carregar meu time
async function loadMyTeam() {
    try {
        // Buscar rodada ativa ou pendente
        const { data: rounds } = await supabase
            .from('rounds')
            .select('id, name, status')
            .in('status', ['active', 'pending'])
            .order('id', { ascending: false })
            .limit(1);

        if (!rounds || rounds.length === 0) {
            document.getElementById('meu-time').innerHTML = `
                <div style="grid-column: 1 / -1;" class="text-center text-gray">
                    Nenhuma rodada disponível
                </div>
            `;
            document.getElementById('rodada-info').textContent = 'Nenhuma rodada';
            return;
        }

        const round = rounds[0];
        const statusText = round.status === 'active' ? '🔴 Em andamento' : '⏳ Pendente';
        document.getElementById('rodada-info').textContent = `${round.name} - ${statusText}`;

        // Buscar escalação
        const { data: lineups } = await supabase
            .from('lineups')
            .select('id, total_points')
            .eq('user_id', currentUser.id)
            .eq('round_id', round.id);

        if (!lineups || lineups.length === 0) {
            document.getElementById('meu-time').innerHTML = `
                <div style="grid-column: 1 / -1;" class="text-center">
                    <p class="text-gray mb-4">Você ainda não escalou um time nesta rodada</p>
                    <a href="mercado.html" class="btn btn-primary">Escalar Time</a>
                </div>
            `;
            return;
        }

        const lineup = lineups[0];

        // Buscar jogadores
        const { data: players } = await supabase
            .from('lineup_players')
            .select(`
                points,
                players (
                    id, name, position, price, photo_url,
                    teams (name, logo_url)
                )
            `)
            .eq('lineup_id', lineup.id)
            .eq('is_starter', true);

        if (!players || players.length === 0) {
            document.getElementById('meu-time').innerHTML = `
                <div style="grid-column: 1 / -1;" class="text-center text-gray">
                    Escalação vazia
                </div>
            `;
            return;
        }

        // Calcular total de pontos
        const totalPoints = players.reduce((sum, p) => sum + (p.points || 0), 0);
        document.getElementById('total-pontos').querySelector('.text-success').textContent = totalPoints;

        // Renderizar jogadores
        const positionColors = {
            'GOL': '#fbbf24',
            'FIX': '#3b82f6',
            'ALA': '#10b981',
            'PIV': '#ef4444'
        };

        document.getElementById('meu-time').innerHTML = players.map(lp => {
            const player = lp.players;
            const points = lp.points || 0;
            const color = positionColors[player.position] || '#6b7280';

            return `
                <div class="card text-center" style="padding: 1rem;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 0.75rem; border-radius: 50%; overflow: hidden; border: 3px solid ${color};">
                        <img src="${player.photo_url || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'40\' text-anchor=\'middle\' dy=\'.3em\'%3E👤%3C/text%3E%3C/svg%3E'}" 
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'%3E%3Crect fill=\\'%23ddd\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-size=\\'40\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3E👤%3C/text%3E%3C/svg%3E'">
                    </div>
                    <div class="badge" style="background: ${color}; color: white; margin-bottom: 0.5rem;">${player.position}</div>
                    <div class="font-semibold text-sm mb-1">${player.name}</div>
                    <div class="text-xs text-gray mb-2">${player.teams?.name || 'Sem time'}</div>
                    <div class="bg-gray-50 rounded p-2">
                        <div class="text-xs text-gray">PONTOS</div>
                        <div class="text-success font-bold" style="font-size: 1.5rem;">${points}</div>
                    </div>
                    <div class="text-xs text-gray mt-2">C$ ${player.price.toFixed(2)}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar time:', error);
        document.getElementById('meu-time').innerHTML = `
            <div style="grid-column: 1 / -1;" class="text-center text-danger">
                Erro ao carregar time
            </div>
        `;
    }
}

// Carregar ranking
async function loadRanking() {
    try {
        const { data: users } = await supabase
            .from('users')
            .select('id, team_name, total_points, cartoletas')
            .order('total_points', { ascending: false })
            .limit(20);

        if (!users || users.length === 0) {
            document.getElementById('ranking-tbody').innerHTML = `
                <tr><td colspan="4" class="text-center text-gray">Nenhum time cadastrado</td></tr>
            `;
            return;
        }

        const tbody = document.getElementById('ranking-tbody');
        tbody.innerHTML = users.map((user, index) => {
            const position = index + 1;
            const isCurrentUser = user.id === currentUser.id;
            
            // Atualizar posição do usuário
            if (isCurrentUser) {
                document.getElementById('user-position').textContent = `${position}º`;
            }

            let positionDisplay = `${position}º`;
            if (position === 1) positionDisplay = '🥇';
            else if (position === 2) positionDisplay = '🥈';
            else if (position === 3) positionDisplay = '🥉';

            const rowClass = isCurrentUser ? 'style="background: #fef3c7;"' : '';

            return `
                <tr ${rowClass}>
                    <td class="text-center font-bold">${positionDisplay}</td>
                    <td class="font-semibold">${user.team_name}${isCurrentUser ? ' <span class="badge badge-primary">Você</span>' : ''}</td>
                    <td class="text-center text-success font-bold">${user.total_points || 0}</td>
                    <td class="text-right text-gray">C$ ${user.cartoletas.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

// Logout
async function handleLogout() {
    const result = await auth.logout();
    if (result.success) {
        window.location.href = 'index.html';
    }
}