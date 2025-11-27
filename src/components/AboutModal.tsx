import React from 'react';
import closeIcon from '../icons/close-svgrepo-com.svg';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  isExiting?: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, isExiting = false, onClose }) => {
  if (!isOpen && !isExiting) return null;

  return (
    <>
      <div className={`about-overlay ${isExiting ? 'exiting' : ''}`} onClick={onClose}></div>
      <div className={`about-modal ${isExiting ? 'exiting' : ''}`}>
        <button className="about-close-btn" onClick={onClose} aria-label="Fechar">
          <img src={closeIcon} alt="Fechar" className="icon" />
        </button>
        <div className="about-content">
          <h1>Quem Somos</h1>
          <div className="about-text">
            <p>
              O time do Féqueijão é formado por uma família apaixonada pela roça. Amantes da culinária e da estrada, nossas viagens sempre foram marcadas pelas receitas e sabores tradicionais que encontramos em cada canto do Brasil.
            </p>

            <p>
              Durante a pandemia, nos fizemos uma pergunta que mudou tudo: por que viajar para consumir os produtos que tanto amamos se eles podem vir até nós?
            </p>

            <p>
              A ideia parecia simples, e maluca. Com pouco dinheiro no bolso e um Fusca na garagem, nasceu o Féqueijão. Começamos vendendo queijos artesanais direto do porta-malas, e em pouco tempo estávamos rodando a cidade levando sabor e história até a casa das pessoas.
            </p>

            <p>
              O sonho cresceu. Hoje, entregamos em todo o Brasil, conectando produtores artesanais a consumidores apaixonados por qualidade e autenticidade.
            </p>

            <p>
              Nosso compromisso é selecionar produtos feitos com alma, contar suas histórias e garantir que cada mordida traga um pedacinho da roça até você.
            </p>

            <p>
              Ah, e o amor pelo queijo só aumentou: me formei Queijista e Sommelier de Vinhos, para continuar descobrindo e compartilhando os melhores sabores da queijaria artesanal brasileira.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutModal;
