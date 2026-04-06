import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const STATS = [
  { value: '2 500+', label: 'Livraisons effectuées' },
  { value: '98%',    label: 'Clients satisfaits' },
  { value: '< 2h',  label: 'Délai moyen' },
  { value: '24/7',  label: 'Disponibilité' },
];

const SERVICES = [
  {
    icon: null,
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadow: 'rgba(102,126,234,.4)',
    titre: 'Livraison directe',
    desc: 'Vous remettez votre colis au livreur qui le dépose directement à destination, rapidement et en sécurité.',
  },
  {
    icon: null,
    color: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    shadow: 'rgba(245,158,11,.4)',
    titre: 'Collecte + Livraison',
    desc: 'Le livreur va chercher votre colis ou document à un point donné, puis le livre à l\'adresse souhaitée.',
  },
  {
    icon: null,
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    shadow: 'rgba(16,185,129,.4)',
    titre: 'Commande établissement',
    desc: 'Commandez dans vos restaurants et commerces préférés — le livreur récupère et vous livre à domicile.',
  },
];

const STEPS = [
  {
    num: '01', icon: null,
    titre: 'Créez votre demande',
    desc: 'Renseignez les adresses de départ et d\'arrivée, le type de livraison et les contacts.',
    color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    shadow: 'rgba(99,102,241,.4)',
  },
  {
    num: '02', icon: null,
    titre: 'Un livreur est assigné',
    desc: 'Notre équipe affecte le livreur disponible le plus proche de votre point de départ.',
    color: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    shadow: 'rgba(245,158,11,.4)',
  },
  {
    num: '03', icon: null,
    titre: 'Livraison confirmée',
    desc: 'Suivez votre colis en temps réel et recevez une confirmation à la livraison.',
    color: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    shadow: 'rgba(16,185,129,.4)',
  },
];

const TRUST = [
  { icon: null, titre: 'Rapidité garantie',      desc: 'Livraison en moins de 2h dans Niamey.' },
  { icon: null, titre: 'Sécurité maximale',       desc: 'Vos colis sont entre des mains de confiance.' },
  { icon: null, titre: 'Suivi en temps réel',     desc: 'Suivez chaque étape sur votre tableau de bord.' },
  { icon: null, titre: 'Paiement à la livraison', desc: 'Règlement cash à la réception, sans avance.' },
];

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Verrou scroll quand menu mobile ouvert */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="home">

      {/* ══════════════════════ NAVBAR ══════════════════════ */}
      <nav className={`hn-nav ${scrolled ? 'hn-nav--scrolled' : 'hn-nav--top'}`}>
        <div className="hn-nav-inner">

          {/* Logo */}
          <Link to="/" className="hn-logo" onClick={closeMenu}>
            <img src="/logo.png" alt="MIZNAS Livraison" className="hn-logo-img" />
          </Link>

          {/* Liens desktop */}
          <div className="hn-nav-links">
            <a href="#services" className="hn-nav-link">Services</a>
            <a href="#comment"  className="hn-nav-link">Comment ça marche</a>
            <a href="#contact"  className="hn-nav-link">Contact</a>
          </div>

          {/* CTA desktop */}
          <div className="hn-nav-cta">
            <Link to="/login"    className="hn-btn hn-btn--outline">Se connecter</Link>
            <Link to="/register" className="hn-btn hn-btn--solid">Créer un compte</Link>
          </div>

          {/* Burger mobile */}
          <button
            className={`hn-burger ${menuOpen ? 'hn-burger--open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Ouvrir le menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Menu mobile overlay */}
        <div className={`hn-mobile-menu ${menuOpen ? 'hn-mobile-menu--open' : ''}`}>
          <a href="#services" className="hn-mobile-link" onClick={closeMenu}>Services</a>
          <a href="#comment"  className="hn-mobile-link" onClick={closeMenu}>Comment ça marche</a>
          <a href="#contact"  className="hn-mobile-link" onClick={closeMenu}>Contact</a>
          <div className="hn-mobile-divider" />
          <Link to="/login"    className="hn-mobile-link hn-mobile-link--outline" onClick={closeMenu}>Se connecter</Link>
          <Link to="/register" className="hn-mobile-link hn-mobile-link--solid"   onClick={closeMenu}>Créer un compte</Link>
        </div>
      </nav>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="hn-hero">
        <div className="hn-hero-bg" />
        {/* Déco géométrique */}
        <div className="hn-hero-deco hn-hero-deco--1" />
        <div className="hn-hero-deco hn-hero-deco--2" />
        <div className="hn-hero-deco hn-hero-deco--3" />

        <div className="hn-hero-inner">
          <div className="hn-hero-content">

            <span className="hn-hero-badge">Service disponible à Niamey</span>

            <h1 className="hn-hero-title">
              Vos livraisons,<br />
              <span className="hn-hero-gradient">rapides &amp; fiables</span>
            </h1>

            <p className="hn-hero-sub">
              Confiez vos colis, documents et commandes à nos livreurs professionnels.
              Livraison en moins de 2 heures, suivi en temps réel, paiement à la réception.
            </p>

            <div className="hn-hero-actions">
              <Link to="/register" className="hn-cta-primary">
                Commencer maintenant →
              </Link>
              <Link to="/login" className="hn-cta-secondary">
                J'ai déjà un compte
              </Link>
            </div>

            <div className="hn-hero-pills">
              <span className="hn-pill">Sans abonnement</span>
              <span className="hn-pill">Livraison express</span>
              <span className="hn-pill">Paiement à la livraison</span>
            </div>
          </div>

        </div>

        {/* Vague de transition */}
        <div className="hn-hero-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════ STATS ══════════════════════ */}
      <section className="hn-stats">
        <div className="hn-stats-inner">
          {STATS.map((s, i) => (
            <div key={i} className="hn-stat">
              <span className="hn-stat-value">{s.value}</span>
              <span className="hn-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ SERVICES ══════════════════════ */}
      <section className="hn-section" id="services">
        <div className="hn-section-inner">
          <div className="hn-section-head">
            <span className="hn-section-tag">Nos services</span>
            <h2 className="hn-section-title">3 formules adaptées<br />à vos besoins</h2>
            <p className="hn-section-sub">
              Que vous ayez un colis à envoyer, un document à récupérer ou une commande à faire livrer, nous avons la solution.
            </p>
          </div>
          <div className="hn-services-grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="hn-service-card" style={{ '--accent': s.color, '--accent-shadow': s.shadow }}>
                <div className="hn-service-icon-wrap">
                  <span className="hn-service-icon-num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="hn-service-titre">{s.titre}</h3>
                <p className="hn-service-desc">{s.desc}</p>
                <Link to="/register" className="hn-service-link">Essayer →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ COMMENT ÇA MARCHE ══════════════════════ */}
      <section className="hn-section hn-section--alt" id="comment">
        <div className="hn-section-inner">
          <div className="hn-section-head">
            <span className="hn-section-tag">Simple &amp; rapide</span>
            <h2 className="hn-section-title">Comment ça marche ?</h2>
            <p className="hn-section-sub">En 3 étapes seulement, votre livraison est en route.</p>
          </div>
          <div className="hn-steps">
            {STEPS.map((step, i) => (
              <div key={i} className="hn-step" style={{ '--step-color': step.color, '--step-shadow': step.shadow }}>
                <div className="hn-step-num">{step.num}</div>
                <h3 className="hn-step-titre">{step.titre}</h3>
                <p className="hn-step-desc">{step.desc}</p>
                {i < STEPS.length - 1 && <div className="hn-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ TRUST ══════════════════════ */}
      <section className="hn-section">
        <div className="hn-section-inner">
          <div className="hn-trust-grid">
            <div className="hn-trust-content">
              <span className="hn-section-tag">Pourquoi nous choisir ?</span>
              <h2 className="hn-section-title hn-left">La livraison pensée<br />pour votre quotidien</h2>
              <div className="hn-trust-list">
                {TRUST.map((item, i) => (
                  <div key={i} className="hn-trust-item">
                    <span className="hn-trust-icon-dot" />
                    <div>
                      <strong>{item.titre}</strong>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hn-trust-visual">
              <div className="hn-trust-badge hn-trust-badge--1">
                <p>"Livraison en 45 min, impeccable !"</p>
                <small>— Mariama K.</small>
              </div>
              <div className="hn-trust-badge hn-trust-badge--2">
                <p>Service n°1<br />à Niamey</p>
              </div>
              <div className="hn-trust-badge hn-trust-badge--3">
                <p>+2 500<br />livraisons</p>
              </div>
              <div className="hn-trust-blob" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA BANNER ══════════════════════ */}
      <section className="hn-cta-section">
        <div className="hn-cta-section-bg" />
        <div className="hn-cta-inner">
          <div className="hn-cta-logo-wrap">
            <img src="/logo.png" alt="MIZNAS" className="hn-cta-logo" />
          </div>
          <h2>Prêt à envoyer votre premier colis ?</h2>
          <p>Inscription gratuite, aucun abonnement requis. Payez uniquement à la livraison.</p>
          <div className="hn-cta-btns">
            <Link to="/register" className="hn-cta-primary hn-cta-primary--white">
              Créer un compte gratuit →
            </Link>
            <Link to="/login" className="hn-cta-secondary hn-cta-secondary--white">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="hn-footer" id="contact">
        <div className="hn-footer-inner">
          <div className="hn-footer-top">

            <div className="hn-footer-brand">
              <Link to="/" className="hn-footer-logo-link">
                <img src="/logo.png" alt="MIZNAS Livraison" className="hn-footer-logo" />
              </Link>
              <p>Service de coursier urbain pour vos livraisons rapides et sécurisées à Niamey. Paiement cash, suivi en temps réel.</p>
              <div className="hn-footer-socials">
                <a href="#contact" aria-label="Facebook"  className="hn-social">f</a>
                <a href="#contact" aria-label="Twitter"   className="hn-social">𝕏</a>
                <a href="#contact" aria-label="Instagram" className="hn-social">in</a>
                <a href="#contact" aria-label="WhatsApp"  className="hn-social">w</a>
              </div>
            </div>

            <div className="hn-footer-col">
              <h4>Services</h4>
              <ul>
                <li><a href="#services">Livraison directe</a></li>
                <li><a href="#services">Collecte + livraison</a></li>
                <li><a href="#services">Commande établissement</a></li>
                <li><Link to="/register">Créer une commande</Link></li>
              </ul>
            </div>

            <div className="hn-footer-col">
              <h4>Compte</h4>
              <ul>
                <li><Link to="/register">S'inscrire</Link></li>
                <li><Link to="/login">Se connecter</Link></li>
                <li><Link to="/forgot-password">Mot de passe oublié</Link></li>
                <li><Link to="/dashboard">Tableau de bord</Link></li>
              </ul>
            </div>

            <div className="hn-footer-col hn-footer-col--contact">
              <h4>Contact</h4>
              <div className="hn-footer-contacts">
                <div className="hn-footer-contact-item">
                  <span className="hn-contact-label">Tel</span>
                  <div>
                    <strong>Téléphone</strong>
                    <a href="tel:+22796648383">+227 96 64 83 83</a>
                  </div>
                </div>
                <div className="hn-footer-contact-item">
                  <span className="hn-contact-label">Mail</span>
                  <div>
                    <strong>Email</strong>
                    <a href="mailto:contact@miznas.ne">contact@miznas.ne</a>
                  </div>
                </div>
                <div className="hn-footer-contact-item">
                  <span className="hn-contact-label">Lieu</span>
                  <div>
                    <strong>Ville</strong>
                    <span>Niamey, Niger</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="hn-footer-bottom">
            <p>© {new Date().getFullYear()} MIZNAS Livraison. Tous droits réservés.</p>
            <div className="hn-footer-bottom-links">
              <a href="#contact">Conditions d'utilisation</a>
              <a href="#contact">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
