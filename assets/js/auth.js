// ============================================
// LNF FANTASY - AUTENTICAÇÃO
// ============================================

class Auth {
    constructor() {
        this.currentUser = null;
    }

    // Verificar se usuário está autenticado
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                return null;
            }

            // Buscar dados completos do usuário
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (userError) {
                console.error('Erro ao buscar dados do usuário:', userError);
                return null;
            }

            this.currentUser = userData;
            return userData;

        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return null;
        }
    }

    // Login
    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) {
                throw new Error(error.message);
            }

            // Buscar dados do usuário
            const user = await this.getCurrentUser();
            
            if (!user) {
                throw new Error('Erro ao carregar dados do usuário');
            }

            return { success: true, user };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Registro
    async register(email, password, teamName) {
        try {
            // Criar usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password
            });

            if (authError) {
                throw new Error(authError.message);
            }

            if (!authData.user) {
                throw new Error('Erro ao criar usuário');
            }

            // Aguardar um momento para o trigger criar o registro em users
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Atualizar nome do time
            const { error: updateError } = await supabase
                .from('users')
                .update({ team_name: teamName.trim() })
                .eq('id', authData.user.id);

            if (updateError) {
                console.warn('Erro ao atualizar nome do time:', updateError);
            }

            // Fazer login automático
            const loginResult = await this.login(email, password);
            
            return loginResult;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                throw new Error(error.message);
            }

            this.currentUser = null;
            return { success: true };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Redirecionar se não autenticado
    async requireAuth() {
        const user = await this.getCurrentUser();
        
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }

        return user;
    }

    // Verificar se é admin
    isAdmin() {
        return this.currentUser && this.currentUser.is_admin === true;
    }
}

// Instância global
const auth = new Auth();