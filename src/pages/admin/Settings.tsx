import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useStore } from '../../contexts/StoreContext';
import { updateStoreInfo, type OperatingDay } from '../../services/storeService';
import { getCurrentTimeInTimezone, getDayNameInPortuguese } from '../../utils/timezoneHelper';
import './Settings.css';

export default function AdminSettings() {
  const { store, reloadStore } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para descrição
  const [description, setDescription] = useState('');

  // Estados para localização e horários
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [isClosed, setIsClosed] = useState(false);
  const [appointmentOnlyMode, setAppointmentOnlyMode] = useState(false);
  const [operatingDays, setOperatingDays] = useState<OperatingDay[]>([
    { day: 'monday', open: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'tuesday', open: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'wednesday', open: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'thursday', open: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'friday', open: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'saturday', open: true, openTime: '09:00', closeTime: '13:00' },
    { day: 'sunday', open: false, openTime: undefined, closeTime: undefined },
  ]);
  const [currentTimeInfo, setCurrentTimeInfo] = useState<{ timeString: string; dayOfWeek: string } | null>(null);

  // Carregar dados da loja quando disponível
  useEffect(() => {
    if (store) {
      setDescription(store.description || '');
      
      // Carregar dados de localização e horários
      setCity(store.city || '');
      setState(store.state || '');
      setTimezone(store.timezone || 'America/Sao_Paulo');
      setIsClosed(store.isClosed ?? false);
      setAppointmentOnlyMode(store.appointmentOnlyMode ?? false);
      if (store.operatingDays && store.operatingDays.length > 0) {
        setOperatingDays(store.operatingDays);
      }
    }
  }, [store]);

  // Atualizar horário atual periodicamente
  useEffect(() => {
    const updateTime = () => {
      if (timezone) {
        const timeInfo = getCurrentTimeInTimezone(timezone);
        setCurrentTimeInfo({
          timeString: timeInfo.timeString,
          dayOfWeek: timeInfo.dayOfWeek,
        });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [timezone]);

  const handleUpdateOperatingDay = (day: OperatingDay['day'], field: 'open' | 'openTime' | 'closeTime', value: boolean | string) => {
    setOperatingDays(prev => prev.map(d => {
      if (d.day === day) {
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const handleSave = async () => {
    if (!store?.id) {
      setError('Loja não encontrada');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateStoreInfo(store.id, {
        description: description.trim() || undefined,
        city: city || undefined,
        state: state || undefined,
        timezone: timezone || 'America/Sao_Paulo',
        isClosed,
        appointmentOnlyMode,
        operatingDays: operatingDays.length > 0 ? operatingDays : undefined,
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
                      setDescription(store.description || '');
                      setCity(store.city || '');
                      setState(store.state || '');
                      setTimezone(store.timezone || 'America/Sao_Paulo');
                      setIsClosed(store.isClosed ?? false);
                      setAppointmentOnlyMode(store.appointmentOnlyMode ?? false);
                      if (store.operatingDays && store.operatingDays.length > 0) {
                        setOperatingDays(store.operatingDays);
                      }
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
            <div className="form-item full-width">
              <label htmlFor="description">
                Descrição da Loja
                <span className="field-hint">Exibida no modal de detalhes da loja</span>
              </label>
              {isEditing ? (
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Loja especializada em queijos artesanais..."
                  className="form-textarea"
                  rows={4}
                />
              ) : (
                <p className="info-value">{store?.description || 'Não informado'}</p>
              )}
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <h2>Localização e Horários de Funcionamento</h2>
            {!isEditing ? (
              <button
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Editar
              </button>
            ) : null}
          </div>

          <div className="form-grid">
            {/* Seleção de Cidade e Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', width: '100%', marginBottom: '16px' }}>
              <div className="form-item">
                <label htmlFor="city">
                  Cidade *
                  <span className="field-hint">Cidade onde a loja está localizada</span>
                </label>
                {isEditing ? (
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="form-input"
                  />
                ) : (
                  <p className="info-value">{store?.city || 'Não informado'}</p>
                )}
              </div>
              <div className="form-item">
                <label htmlFor="state">
                  Estado (UF) *
                  <span className="field-hint">Sigla do estado</span>
                </label>
                {isEditing ? (
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="SP"
                    maxLength={2}
                    className="form-input"
                    style={{ textTransform: 'uppercase' }}
                  />
                ) : (
                  <p className="info-value">{store?.state || 'Não informado'}</p>
                )}
              </div>
            </div>

            {/* Timezone */}
            <div className="form-item">
              <label htmlFor="timezone">
                Fuso Horário
                <span className="field-hint">Timezone da cidade da loja</span>
              </label>
              {isEditing ? (
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="form-input"
                >
                  <option value="America/Sao_Paulo">Brasil (São Paulo) - UTC-3</option>
                  <option value="America/Manaus">Brasil (Manaus) - UTC-4</option>
                  <option value="America/Rio_Branco">Brasil (Rio Branco) - UTC-5</option>
                  <option value="America/Fortaleza">Brasil (Fortaleza) - UTC-3</option>
                  <option value="America/Recife">Brasil (Recife) - UTC-3</option>
                  <option value="America/Bahia">Brasil (Salvador) - UTC-3</option>
                </select>
              ) : (
                <p className="info-value">
                  {timezone === 'America/Sao_Paulo' ? 'Brasil (São Paulo) - UTC-3' :
                   timezone === 'America/Manaus' ? 'Brasil (Manaus) - UTC-4' :
                   timezone === 'America/Rio_Branco' ? 'Brasil (Rio Branco) - UTC-5' :
                   timezone === 'America/Fortaleza' ? 'Brasil (Fortaleza) - UTC-3' :
                   timezone === 'America/Recife' ? 'Brasil (Recife) - UTC-3' :
                   timezone === 'America/Bahia' ? 'Brasil (Salvador) - UTC-3' :
                   timezone || 'Não informado'}
                </p>
              )}
            </div>

            {/* Horário Atual na Cidade */}
            {currentTimeInfo && city && isEditing && (
              <div className="form-item full-width">
                <div style={{
                  padding: '16px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  border: '1px solid #90caf9'
                }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1976d2', margin: '0 0 4px 0' }}>
                    Horário atual em {city}{state ? ` - ${state}` : ''}:
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#1565c0', margin: 0 }}>
                    {currentTimeInfo.dayOfWeek}, {currentTimeInfo.timeString}
                  </p>
                </div>
              </div>
            )}

            {/* Toggles para Status da Loja */}
            {isEditing && (
              <>
                <div className="form-item full-width">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <label style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>
                        Loja Fechada
                      </label>
                      <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                        Marque esta opção para fechar a loja temporariamente
                      </p>
                    </div>
                    <div className="toggle-container" style={{ margin: 0, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        id="isClosedToggle"
                        checked={isClosed}
                        onChange={(e) => setIsClosed(e.target.checked)}
                      />
                      <label htmlFor="isClosedToggle">Toggle</label>
                    </div>
                  </div>
                </div>

                <div className="form-item full-width">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <label style={{ fontSize: '16px', fontWeight: '600', color: '#333', margin: 0 }}>
                        Modo Somente Agendamento
                      </label>
                      <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                        Quando ativado, a loja só aceita pedidos agendados
                      </p>
                    </div>
                    <div className="toggle-container" style={{ margin: 0, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        id="appointmentOnlyToggle"
                        checked={appointmentOnlyMode}
                        onChange={(e) => setAppointmentOnlyMode(e.target.checked)}
                      />
                      <label htmlFor="appointmentOnlyToggle">Toggle</label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!isEditing && (
              <>
                <div className="form-item">
                  <label>Status da Loja</label>
                  <p className="info-value">
                    {store?.isClosed ? '🔴 Fechada' : store?.appointmentOnlyMode ? '🟡 Somente Agendamento' : '🟢 Aberta'}
                  </p>
                </div>
              </>
            )}

            {/* Dias de Funcionamento */}
            <div className="form-item full-width">
              <label>
                Horários de Funcionamento por Dia
                <span className="field-hint">Configure os horários de abertura e fechamento para cada dia da semana</span>
              </label>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {operatingDays.map((dayConfig) => (
                    <div
                      key={dayConfig.day}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <div style={{ minWidth: '140px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '4px' }}>
                          {getDayNameInPortuguese(dayConfig.day)}
                        </label>
                        <div className="toggle-container" style={{ margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={dayConfig.open}
                            onChange={(e) => handleUpdateOperatingDay(dayConfig.day, 'open', e.target.checked)}
                          />
                          <label>Toggle</label>
                        </div>
                      </div>
                      {dayConfig.open && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                              Abertura
                            </label>
                            <input
                              type="time"
                              value={dayConfig.openTime || '08:00'}
                              onChange={(e) => handleUpdateOperatingDay(dayConfig.day, 'openTime', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                fontSize: '14px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: '600', color: '#666', marginTop: '20px' }}>—</span>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                              Fechamento
                            </label>
                            <input
                              type="time"
                              value={dayConfig.closeTime || '18:00'}
                              onChange={(e) => handleUpdateOperatingDay(dayConfig.day, 'closeTime', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                fontSize: '14px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: '12px' }}>
                  {store?.operatingDays && store.operatingDays.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {store.operatingDays.map((day) => (
                        <p key={day.day} className="info-value">
                          {getDayNameInPortuguese(day.day)}: {day.open 
                            ? `${day.openTime || '08:00'} - ${day.closeTime || '18:00'}`
                            : 'Fechado'}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="info-value">Não configurado</p>
                  )}
                </div>
              )}
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

