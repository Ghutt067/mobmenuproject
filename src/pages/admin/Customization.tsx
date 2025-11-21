import { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../contexts/StoreContext';
import AdminLayout from '../../components/admin/AdminLayout';
import './Customization.css';

interface CustomizationState {
  logoUrl?: string;
  promoBannerVisible: boolean;
  promoBannerText: string;
  promoBannerBgColor: string;
  promoBannerTextColor: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export default function AdminCustomization() {
  const { store, reloadCustomizations } = useStore();
  const [customization, setCustomization] = useState<CustomizationState>({
    promoBannerVisible: true,
    promoBannerText: 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF',
    promoBannerBgColor: '#FDD8A7',
    promoBannerTextColor: '#000000',
    primaryColor: '#FF6B35',
    secondaryColor: '#004E89',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadCustomization();
  }, [store]);

  const loadCustomization = async () => {
    if (!store) return;

    setLoading(true);
    const { data } = await supabase
      .from('store_customizations')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (data) {
      setCustomization({
        logoUrl: data.logo_url,
        promoBannerVisible: data.promo_banner_visible ?? true,
        promoBannerText: data.promo_banner_text || 'ESQUENTA BLACK FRIDAY - ATÉ 60%OFF',
        promoBannerBgColor: data.promo_banner_bg_color || '#FDD8A7',
        promoBannerTextColor: data.promo_banner_text_color || '#000000',
        primaryColor: data.primary_color || '#FF6B35',
        secondaryColor: data.secondary_color || '#004E89',
        backgroundColor: data.background_color || '#FFFFFF',
        textColor: data.text_color || '#000000',
      });

      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    }
    setLoading(false);
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !store) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${store.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(fileName, logoFile, {
          upsert: true,
        });

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!store) return;

    setSaving(true);
    setMessage('');

    try {
      let logoUrl = customization.logoUrl;

      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          throw new Error('Erro ao fazer upload do logo');
        }
      }

      const { error } = await supabase
        .from('store_customizations')
        .upsert({
          store_id: store.id,
          logo_url: logoUrl,
          promo_banner_visible: customization.promoBannerVisible,
          promo_banner_text: customization.promoBannerText,
          promo_banner_bg_color: customization.promoBannerBgColor,
          promo_banner_text_color: customization.promoBannerTextColor,
          primary_color: customization.primaryColor,
          secondary_color: customization.secondaryColor,
          background_color: customization.backgroundColor,
          text_color: customization.textColor,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage('✅ Personalização salva com sucesso!');
      setLogoFile(null);
      
      // Recarregar customizações no contexto
      await reloadCustomizations();

    } catch (err: any) {
      setMessage(`❌ Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Carregando...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="customization-page">
        <h1>Personalização da Loja</h1>
        <p className="subtitle">Customize as cores, logo e banner da sua loja</p>

        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Seção: Logo */}
        <section className="customization-section">
          <h2>Logo da Loja</h2>
          <div className="logo-upload">
            <div className="logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" />
              ) : (
                <div className="logo-placeholder">Sem logo</div>
              )}
            </div>
            <div className="upload-controls">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                id="logo-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="logo-input" className="upload-button">
                📤 Escolher logo
              </label>
              <p className="upload-hint">Formatos: PNG, JPG, SVG | Tamanho máximo: 2MB</p>
            </div>
          </div>
        </section>

        {/* Seção: Banner Promocional */}
        <section className="customization-section">
          <h2>Banner Promocional</h2>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={customization.promoBannerVisible}
                onChange={(e) => setCustomization({
                  ...customization,
                  promoBannerVisible: e.target.checked,
                })}
              />
              <span>Mostrar banner promocional</span>
            </label>
          </div>

          {customization.promoBannerVisible && (
            <>
              <div className="form-group">
                <label>Texto do banner</label>
                <input
                  type="text"
                  value={customization.promoBannerText}
                  onChange={(e) => setCustomization({
                    ...customization,
                    promoBannerText: e.target.value,
                  })}
                  placeholder="Ex: ESQUENTA BLACK FRIDAY - ATÉ 60%OFF"
                />
              </div>

              <div className="color-row">
                <div className="form-group">
                  <label>Cor de fundo</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={customization.promoBannerBgColor}
                      onChange={(e) => setCustomization({
                        ...customization,
                        promoBannerBgColor: e.target.value,
                      })}
                    />
                    <span className="color-value">{customization.promoBannerBgColor}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Cor do texto</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={customization.promoBannerTextColor}
                      onChange={(e) => setCustomization({
                        ...customization,
                        promoBannerTextColor: e.target.value,
                      })}
                    />
                    <span className="color-value">{customization.promoBannerTextColor}</span>
                  </div>
                </div>
              </div>

              <div className="banner-preview">
                <p className="preview-label">Preview:</p>
                <div
                  className="preview-banner"
                  style={{
                    backgroundColor: customization.promoBannerBgColor,
                    color: customization.promoBannerTextColor,
                  }}
                >
                  {customization.promoBannerText}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Seção: Cores da Loja */}
        <section className="customization-section">
          <h2>Cores da Loja</h2>

          <div className="color-row">
            <div className="form-group">
              <label>Cor primária</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={customization.primaryColor}
                  onChange={(e) => setCustomization({
                    ...customization,
                    primaryColor: e.target.value,
                  })}
                />
                <span className="color-value">{customization.primaryColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Cor secundária</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={customization.secondaryColor}
                  onChange={(e) => setCustomization({
                    ...customization,
                    secondaryColor: e.target.value,
                  })}
                />
                <span className="color-value">{customization.secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="color-row">
            <div className="form-group">
              <label>Cor de fundo</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={customization.backgroundColor}
                  onChange={(e) => setCustomization({
                    ...customization,
                    backgroundColor: e.target.value,
                  })}
                />
                <span className="color-value">{customization.backgroundColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Cor do texto</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={customization.textColor}
                  onChange={(e) => setCustomization({
                    ...customization,
                    textColor: e.target.value,
                  })}
                />
                <span className="color-value">{customization.textColor}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="actions">
          <button
            onClick={handleSave}
            disabled={saving}
            className="save-button"
          >
            {saving ? 'Salvando...' : '💾 Salvar Alterações'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

