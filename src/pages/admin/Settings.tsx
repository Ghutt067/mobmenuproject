import AdminLayout from '../../components/admin/AdminLayout';
import { useStore } from '../../contexts/StoreContext';
import './Settings.css';

export default function AdminSettings() {
  const { store } = useStore();

  return (
    <AdminLayout>
      <div className="settings-page">
        <h1>Configurações</h1>
        <p className="subtitle">Gerencie as configurações gerais da sua loja</p>

        <section className="settings-section">
          <h2>Informações da Loja</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Nome da Loja</label>
              <p>{store?.name}</p>
            </div>
            <div className="info-item">
              <label>Slug</label>
              <p>{store?.slug}</p>
            </div>
            <div className="info-item">
              <label>Email do Proprietário</label>
              <p>{store?.ownerEmail}</p>
            </div>
            <div className="info-item">
              <label>Status da Assinatura</label>
              <p className="status-badge active">{store?.subscriptionStatus}</p>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>Acesso à Loja</h2>
          <div className="access-info">
            <p className="info-label">URL da sua loja:</p>
            <div className="url-display">
              <code>{window.location.origin}/?store={store?.slug}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?store=${store?.slug}`);
                  alert('URL copiada!');
                }}
                className="copy-button"
              >
                📋 Copiar
              </button>
            </div>
            <p className="info-hint">
              Compartilhe esta URL com seus clientes para que eles acessem sua loja.
            </p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Outras Configurações</h2>
          <div className="coming-soon-box">
            <p>🚧 Configurações adicionais estarão disponíveis em breve:</p>
            <ul>
              <li>Configurações de entrega</li>
              <li>Formas de pagamento</li>
              <li>Notificações por email</li>
              <li>Integrações</li>
            </ul>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

