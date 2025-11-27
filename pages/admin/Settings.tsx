import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useStore } from '../../contexts/StoreContext';
import { updateStoreInfo } from '../../services/storeService';
import './Settings.css';

export default function AdminSettings() {
  const { store, reloadStore } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    address: '',
    closingTime: '',
    openingHours: '',
    description: '',
  });

  // Carregar dados da loja quando disponível
  useEffect(() => {
    if (store) {
      setFormData({
        address: store.address || '',
        closingTime: store.closingTime || '',
        openingHours: store.openingHours || '',
        description: store.description || '',
      });
    }
  }, [store]);

  const handleSave = async () => {
    if (!store?.id) {
      setError('Loja não encontrada');
      return;
    }

    // Validação básica
    if (!formData.address.trim() && !formData.closingTime.trim()) {
      setError('Preencha pelo menos a localização ou o horário de fechamento');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateStoreInfo(store.id, {
        address: formData.address.trim() || undefined,
        closingTime: formData.closingTime.trim() || undefined,
        openingHours: formData.openingHours.trim() || undefined,
        description: formData.description.trim() || undefined,
      });

      setSuccess('Informações salvas com sucesso!');
      setIsEditing(false);
      
      // Recarregar dados da loja para atualizar o contexto
      await reloadStore();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar informações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="section-header">
            <h2>Informações Públicas</h2>
            {!isEditing ? (
              <button
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Editar
              </button>
            ) : (
              <div className="edit-actions">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setSuccess('');
                    // Restaurar valores originais
                    if (store) {
                      setFormData({
                        address: store.address || '',
                        closingTime: store.closingTime || '',
                        openingHours: store.openingHours || '',
                        description: store.description || '',
                      });
                    }
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  className="save-button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : '💾 Salvar'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <div className="form-grid">
            <div className="form-item">
              <label htmlFor="address">
                Localização / Endereço *
                <span className="field-hint">Exibido na página inicial da loja</span>
              </label>
              {isEditing ? (
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: Rua Exemplo, 123 - Centro, São Paulo - SP"
                  className="form-input"
                />
              ) : (
                <p className="info-value">{store?.address || 'Não informado'}</p>
              )}
            </div>

            <div className="form-item">
              <label htmlFor="closingTime">
                Horário de Fechamento *
                <span className="field-hint">Exibido como "Aberto até X" na página inicial</span>
              </label>
              {isEditing ? (
                <input
                  id="closingTime"
                  type="text"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  placeholder="Ex: 22:00 ou 18:00"
                  className="form-input"
                  maxLength={10}
                />
              ) : (
                <p className="info-value">{store?.closingTime || 'Não informado'}</p>
              )}
            </div>

            <div className="form-item full-width">
              <label htmlFor="openingHours">
                Horários de Funcionamento
                <span className="field-hint">Exibido no modal de detalhes da loja</span>
              </label>
              {isEditing ? (
                <textarea
                  id="openingHours"
                  value={formData.openingHours}
                  onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                  placeholder="Ex: Segunda a Sexta: 8h às 18h | Sábado: 8h às 14h"
                  className="form-textarea"
                  rows={3}
                />
              ) : (
                <p className="info-value">{store?.openingHours || 'Não informado'}</p>
              )}
            </div>

            <div className="form-item full-width">
              <label htmlFor="description">
                Descrição da Loja
                <span className="field-hint">Exibida no modal de detalhes da loja</span>
              </label>
              {isEditing ? (
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Loja especializada em queijos artesanais..."
                  className="form-textarea"
                  rows={4}
                />
              ) : (
                <p className="info-value">{store?.description || 'Não informado'}</p>
              )}
            </div>
          </div>

          {!isEditing && (
            <p className="info-hint">
              * Campos marcados com asterisco são exibidos na página inicial da loja
            </p>
          )}
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
              <button
                onClick={() => {
                  window.open(`${window.location.origin}/?store=${store?.slug}`, '_blank');
                }}
                className="test-button"
              >
                🔗 Abrir Loja
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
              <li>Formas de pagamento</li>
              <li>Configurações de entrega</li>
              <li>Notificações por email</li>
              <li>Integrações</li>
            </ul>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

