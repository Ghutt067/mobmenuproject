import AdminLayout from '../../components/admin/AdminLayout';
import './Sections.css';

export default function AdminSections() {
  return (
    <AdminLayout>
      <div className="sections-admin-page">
        <h1>Gerenciamento de Seções</h1>
        <p className="subtitle">Organize seus produtos em categorias e seções personalizadas</p>

        <div className="coming-soon">
          <div className="coming-soon-icon">🚧</div>
          <h2>Em Desenvolvimento</h2>
          <p>
            Esta página estará disponível em breve. Você poderá gerenciar as seções
            (categorias) da sua loja diretamente através desta interface.
          </p>
          <div className="features-list">
            <h3>Funcionalidades em desenvolvimento:</h3>
            <ul>
              <li>✨ Criar novas seções</li>
              <li>✨ Editar seções existentes</li>
              <li>✨ Reordenar seções (drag & drop)</li>
              <li>✨ Associar produtos a seções</li>
              <li>✨ Criar subseções</li>
              <li>✨ Ativar/desativar seções</li>
            </ul>
          </div>
          <p className="temp-note">
            <strong>Por enquanto:</strong> Use o Supabase Table Editor para gerenciar seções (tabelas: sets, subsets).
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

