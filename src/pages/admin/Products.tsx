import AdminLayout from '../../components/admin/AdminLayout';
import './Products.css';

export default function AdminProducts() {
  return (
    <AdminLayout>
      <div className="products-admin-page">
        <h1>Gerenciamento de Produtos</h1>
        <p className="subtitle">Adicione, edite e organize os produtos da sua loja</p>

        <div className="coming-soon">
          <div className="coming-soon-icon">🚧</div>
          <h2>Em Desenvolvimento</h2>
          <p>
            Esta página estará disponível em breve. Você poderá gerenciar seus produtos
            diretamente através desta interface.
          </p>
          <div className="features-list">
            <h3>Funcionalidades em desenvolvimento:</h3>
            <ul>
              <li>✨ Adicionar novos produtos</li>
              <li>✨ Editar produtos existentes</li>
              <li>✨ Upload de imagens de produtos</li>
              <li>✨ Definir preços e descontos</li>
              <li>✨ Organizar produtos em seções</li>
              <li>✨ Ativar/desativar produtos</li>
            </ul>
          </div>
          <p className="temp-note">
            <strong>Por enquanto:</strong> Use o Supabase Table Editor para gerenciar produtos.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

