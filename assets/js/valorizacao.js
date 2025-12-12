// ============================================
// LNF FANTASY - SISTEMA DE VALORIZAÇÃO
// ============================================

/**
 * Sistema automático de valorização/desvalorização
 * Processa ao finalizar rodada
 */

// ============================================
// PROCESSAR VALORIZAÇÃO DA RODADA
// ============================================

async function processarValorizacaoRodada(roundId) {
    try {
        console.log('💰 Processando valorização da rodada:', roundId);
        
        showNotification('Processando valorizações...', 'info');
        
        // 1. Buscar todos os jogadores que jogaram na rodada
        const { data: estatisticas, error: errorStats } = await supabase
            .from('player_stats')
            .select(`
                id,
                player_id,
                round_id,
                points,
                players (
                    id,
                    name,
                    position,
                    price,
                    team:teams(name)
                )
            `)
            .eq('round_id', roundId);
        
        if (errorStats) throw errorStats;
        
        if (!estatisticas || estatisticas.length === 0) {
            showNotification('Nenhuma estatística encontrada para esta rodada', 'warning');
            return;
        }
        
        console.log(`📊 ${estatisticas.length} jogadores com estatísticas`);
        
        let valorizacoes = 0;
        let desvalorizacoes = 0;
        let mantidos = 0;
        
        // 2. Para cada jogador, calcular variação
        for (const stat of estatisticas) {
            const jogador = stat.players;
            const pontos = stat.points || 0;
            const precoAtual = jogador.price;
            
            // Calcular nova variação
            const resultado = calcularVariacaoPreco(precoAtual, pontos);
            
            if (resultado.variacao === 0) {
                mantidos++;
                continue;
            }
            
            // 3. Salvar histórico
            const { error: errorHistory } = await supabase
                .from('player_price_history')
                .upsert({
                    player_id: jogador.id,
                    round_id: roundId,
                    old_price: precoAtual,
                    new_price: resultado.novoPreco,
                    variation: resultado.variacao,
                    points_scored: pontos,
                    reason: resultado.motivo
                }, {
                    onConflict: 'player_id,round_id'
                });
            
            if (errorHistory) {
                console.error('Erro ao salvar histórico:', jogador.name, errorHistory);
                continue;
            }
            
            // 4. Atualizar preço do jogador
            const { error: errorUpdate } = await supabase
                .from('players')
                .update({ price: resultado.novoPreco })
                .eq('id', jogador.id);
            
            if (errorUpdate) {
                console.error('Erro ao atualizar preço:', jogador.name, errorUpdate);
                continue;
            }
            
            // Contabilizar
            if (resultado.variacao > 0) {
                valorizacoes++;
                console.log(`↑ ${jogador.name}: C$ ${precoAtual.toFixed(2)} → C$ ${resultado.novoPreco.toFixed(2)} (+${resultado.variacao.toFixed(2)})`);
            } else {
                desvalorizacoes++;
                console.log(`↓ ${jogador.name}: C$ ${precoAtual.toFixed(2)} → C$ ${resultado.novoPreco.toFixed(2)} (${resultado.variacao.toFixed(2)})`);
            }
        }
        
        console.log(`✅ Processamento concluído:`);
        console.log(`   ↑ Valorizações: ${valorizacoes}`);
        console.log(`   ↓ Desvalorizações: ${desvalorizacoes}`);
        console.log(`   = Mantidos: ${mantidos}`);
        
        // 5. Atualizar patrimônio dos usuários
        const usuariosAtualizados = await atualizarPatrimonioUsuarios(roundId);
        
        showNotification(
            `Valorização processada! ${valorizacoes} ↑ | ${desvalorizacoes} ↓ | ${usuariosAtualizados} usuários atualizados`, 
            'success'
        );
        
        // 6. Gerar relatório
        await gerarRelatorioValorizacao(roundId, {
            total: estatisticas.length,
            valorizacoes,
            desvalorizacoes,
            mantidos,
            usuariosAtualizados
        });
        
        return {
            success: true,
            valorizacoes,
            desvalorizacoes,
            mantidos,
            usuariosAtualizados
        };
        
    } catch (error) {
        console.error('❌ Erro ao processar valorização:', error);
        showNotification('Erro ao processar valorização: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ============================================
// CALCULAR VARIAÇÃO DE PREÇO
// ============================================

function calcularVariacaoPreco(precoAtual, pontos) {
    let percentual = 0;
    let maxVariacao = 0;
    let motivo = '';
    
    // Regras de valorização
    if (pontos >= 8) {
        percentual = 0.10; // +10%
        maxVariacao = 0.30;
        motivo = 'Excelente pontuação (>= 8 pts)';
    } else if (pontos >= 5) {
        percentual = 0.05; // +5%
        maxVariacao = 0.20;
        motivo = 'Boa pontuação (5-7.99 pts)';
    } else if (pontos >= 2) {
        percentual = 0.00; // Mantém
        maxVariacao = 0.00;
        motivo = 'Pontuação regular (2-4.99 pts)';
    } else if (pontos >= 0) {
        percentual = -0.05; // -5%
        maxVariacao = 0.20;
        motivo = 'Baixa pontuação (0-1.99 pts)';
    } else {
        percentual = -0.10; // -10%
        maxVariacao = 0.30;
        motivo = 'Pontuação negativa (< 0 pts)';
    }
    
    // Calcular variação
    let variacao = precoAtual * percentual;
    
    // Aplicar limite máximo
    if (variacao > 0 && variacao > maxVariacao) {
        variacao = maxVariacao;
    } else if (variacao < 0 && Math.abs(variacao) > maxVariacao) {
        variacao = -maxVariacao;
    }
    
    // Calcular novo preço
    let novoPreco = precoAtual + variacao;
    
    // Limites de preço
    if (novoPreco < 1.00) {
        novoPreco = 1.00;
        variacao = novoPreco - precoAtual;
    } else if (novoPreco > 20.00) {
        novoPreco = 20.00;
        variacao = novoPreco - precoAtual;
    }
    
    // Arredondar
    novoPreco = parseFloat(novoPreco.toFixed(2));
    variacao = parseFloat(variacao.toFixed(2));
    
    return {
        novoPreco,
        variacao,
        percentual: percentual * 100,
        motivo
    };
}

// ============================================
// ATUALIZAR PATRIMÔNIO DOS USUÁRIOS
// ============================================

async function atualizarPatrimonioUsuarios(roundId) {
    try {
        console.log('💼 Atualizando patrimônio dos usuários...');
        
        // Buscar todas as escalações da rodada
        const { data: escalacoes, error: errorEscalacoes } = await supabase
            .from('lineups')
            .select('id, user_id')
            .eq('round_id', roundId);
        
        if (errorEscalacoes) throw errorEscalacoes;
        
        if (!escalacoes || escalacoes.length === 0) {
            console.log('Nenhuma escalação encontrada');
            return 0;
        }
        
        let usuariosAtualizados = 0;
        
        for (const escalacao of escalacoes) {
            // Buscar jogadores da escalação
            const { data: jogadoresEscalacao, error: errorJogadores } = await supabase
                .from('lineup_players')
                .select(`
                    player_id,
                    players (price)
                `)
                .eq('lineup_id', escalacao.id);
            
            if (errorJogadores) {
                console.error('Erro ao buscar jogadores da escalação:', errorJogadores);
                continue;
            }
            
            // Calcular patrimônio total
            const patrimonioTotal = jogadoresEscalacao.reduce((total, jp) => {
                return total + (jp.players?.price || 0);
            }, 0);
            
            // Atualizar cartoletas do usuário
            const { error: errorUpdate } = await supabase
                .from('users')
                .update({ cartoletas: parseFloat(patrimonioTotal.toFixed(2)) })
                .eq('id', escalacao.user_id);
            
            if (errorUpdate) {
                console.error('Erro ao atualizar usuário:', errorUpdate);
                continue;
            }
            
            console.log(`💰 Usuário ${escalacao.user_id}: C$ ${patrimonioTotal.toFixed(2)}`);
            usuariosAtualizados++;
        }
        
        console.log(`✅ ${usuariosAtualizados} usuários atualizados`);
        return usuariosAtualizados;
        
    } catch (error) {
        console.error('❌ Erro ao atualizar patrimônio:', error);
        return 0;
    }
}

// ============================================
// GERAR RELATÓRIO DE VALORIZAÇÃO
// ============================================

async function gerarRelatorioValorizacao(roundId, resumo) {
    try {
        // Buscar top 10 valorizações
        const { data: topValorizacoes } = await supabase
            .from('player_price_history')
            .select(`
                player_id,
                old_price,
                new_price,
                variation,
                points_scored,
                players (name, position, team:teams(name))
            `)
            .eq('round_id', roundId)
            .gt('variation', 0)
            .order('variation', { ascending: false })
            .limit(10);
        
        // Buscar top 10 desvalorizações
        const { data: topDesvalorizacoes } = await supabase
            .from('player_price_history')
            .select(`
                player_id,
                old_price,
                new_price,
                variation,
                points_scored,
                players (name, position, team:teams(name))
            `)
            .eq('round_id', roundId)
            .lt('variation', 0)
            .order('variation', { ascending: true })
            .limit(10);
        
        console.log('\n📊 RELATÓRIO DE VALORIZAÇÃO');
        console.log('========================================');
        console.log(`Total de jogadores: ${resumo.total}`);
        console.log(`↑ Valorizações: ${resumo.valorizacoes}`);
        console.log(`↓ Desvalorizações: ${resumo.desvalorizacoes}`);
        console.log(`= Mantidos: ${resumo.mantidos}`);
        console.log(`👥 Usuários atualizados: ${resumo.usuariosAtualizados}`);
        console.log('========================================\n');
        
        if (topValorizacoes && topValorizacoes.length > 0) {
            console.log('🏆 TOP 10 VALORIZAÇÕES:');
            topValorizacoes.forEach((v, i) => {
                console.log(`${i + 1}. ${v.players.name} (${v.players.position}) - ${v.players.team?.name || 'S/T'}`);
                console.log(`   C$ ${v.old_price.toFixed(2)} → C$ ${v.new_price.toFixed(2)} (+${v.variation.toFixed(2)}) | ${v.points_scored} pts`);
            });
            console.log('');
        }
        
        if (topDesvalorizacoes && topDesvalorizacoes.length > 0) {
            console.log('📉 TOP 10 DESVALORIZAÇÕES:');
            topDesvalorizacoes.forEach((d, i) => {
                console.log(`${i + 1}. ${d.players.name} (${d.players.position}) - ${d.players.team?.name || 'S/T'}`);
                console.log(`   C$ ${d.old_price.toFixed(2)} → C$ ${d.new_price.toFixed(2)} (${d.variation.toFixed(2)}) | ${d.points_scored} pts`);
            });
            console.log('');
        }
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
    }
}

// ============================================
// VISUALIZAR HISTÓRICO DE VALORIZAÇÃO
// ============================================

async function visualizarHistoricoValorizacao(playerId = null, roundId = null) {
    try {
        let query = supabase
            .from('player_price_history')
            .select(`
                id,
                round_id,
                old_price,
                new_price,
                variation,
                points_scored,
                reason,
                created_at,
                rounds (name),
                players (name, position, team:teams(name))
            `)
            .order('created_at', { ascending: false });
        
        if (playerId) {
            query = query.eq('player_id', playerId);
        }
        
        if (roundId) {
            query = query.eq('round_id', roundId);
        }
        
        const { data, error } = await query.limit(50);
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        console.error('Erro ao visualizar histórico:', error);
        return [];
    }
}

// ============================================
// RESETAR PREÇOS (ÚTIL PARA NOVA TEMPORADA)
// ============================================

async function resetarPrecosJogadores(precoInicial = 5.00) {
    if (!confirm(`Resetar TODOS os preços para C$ ${precoInicial.toFixed(2)}? Esta ação não pode ser desfeita!`)) {
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('players')
            .update({ price: precoInicial })
            .select('id');
        
        if (error) throw error;
        
        console.log(`✅ ${data.length} jogadores resetados para C$ ${precoInicial.toFixed(2)}`);
        showNotification(`Preços resetados! ${data.length} jogadores`, 'success');
        
    } catch (error) {
        console.error('Erro ao resetar preços:', error);
        showNotification('Erro ao resetar preços', 'error');
    }
}

// ============================================
// HOOK: FINALIZAR RODADA COM VALORIZAÇÃO
// ============================================

async function finalizarRodadaComValorizacao(roundId) {
    if (!confirm('Finalizar esta rodada? Isso irá:\n\n1. Processar valorizações/desvalorizações\n2. Atualizar patrimônio dos usuários\n3. Reabrir o mercado\n\nConfirmar?')) {
        return;
    }
    
    try {
        console.log('🏁 Finalizando rodada:', roundId);
        
        // 1. Processar valorização
        const resultado = await processarValorizacaoRodada(roundId);
        
        if (!resultado.success) {
            throw new Error('Erro ao processar valorização');
        }
        
        // 2. Finalizar rodada
        const { error: errorFinalizar } = await supabase
            .from('rounds')
            .update({ status: 'finished' })
            .eq('id', roundId);
        
        if (errorFinalizar) throw errorFinalizar;
        
        // 3. Resetar cartoletas para C$ 100.00 (novo ciclo)
        const { error: errorReset } = await supabase
            .from('users')
            .update({ cartoletas: 100.00 });
        
        if (errorReset) {
            console.warn('Aviso ao resetar cartoletas:', errorReset);
        }
        
        console.log('✅ Rodada finalizada com sucesso!');
        showNotification('Rodada finalizada! Valorizações processadas e mercado reaberto.', 'success');
        
        // Recarregar dados
        await carregarRodadas();
        
    } catch (error) {
        console.error('❌ Erro ao finalizar rodada:', error);
        showNotification('Erro ao finalizar rodada: ' + error.message, 'error');
    }
}

// ============================================
// EXPORTAR FUNÇÕES
// ============================================

window.processarValorizacaoRodada = processarValorizacaoRodada;
window.atualizarPatrimonioUsuarios = atualizarPatrimonioUsuarios;
window.visualizarHistoricoValorizacao = visualizarHistoricoValorizacao;
window.resetarPrecosJogadores = resetarPrecosJogadores;
window.finalizarRodadaComValorizacao = finalizarRodadaComValorizacao;
window.calcularVariacaoPreco = calcularVariacaoPreco;

console.log('✅ Sistema de Valorização LNF Fantasy carregado 💰');