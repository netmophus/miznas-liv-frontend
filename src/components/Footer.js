import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="ft-footer">
      <div className="ft-inner">
        <div className="ft-top">

          <div className="ft-brand">
            <Link to="/" className="ft-logo">
              <span>🚚</span>
              <span>Swift<strong>Livraison</strong></span>
            </Link>
            <p>Service de coursier urbain pour vos livraisons rapides et sécurisées. Paiement cash, suivi en temps réel.</p>
            <div className="ft-socials">
              <a href="#" aria-label="Facebook"  className="ft-social">f</a>
              <a href="#" aria-label="Twitter"   className="ft-social">𝕏</a>
              <a href="#" aria-label="Instagram" className="ft-social">in</a>
              <a href="#" aria-label="WhatsApp"  className="ft-social">w</a>
            </div>
          </div>

          <div className="ft-col">
            <h4>Services</h4>
            <ul>
              <li><Link to="/#services">Livraison directe</Link></li>
              <li><Link to="/#services">Collecte + livraison</Link></li>
              <li><Link to="/#services">Commande établissement</Link></li>
              <li><Link to="/register">Créer une commande</Link></li>
            </ul>
          </div>

          <div className="ft-col">
            <h4>Compte</h4>
            <ul>
              <li><Link to="/register">S'inscrire</Link></li>
              <li><Link to="/login">Se connecter</Link></li>
              <li><Link to="/forgot-password">Mot de passe oublié</Link></li>
              <li><Link to="/dashboard">Tableau de bord</Link></li>
            </ul>
          </div>

          <div className="ft-col ft-col--contact">
            <h4>Contact</h4>
            <div className="ft-contacts">
              <div className="ft-contact-item">
                <span>📞</span>
                <div>
                  <strong>Téléphone</strong>
                  <a href="tel:+22796648383">+227 96 64 83 83</a>
                </div>
              </div>
              <div className="ft-contact-item">
                <span>📧</span>
                <div>
                  <strong>Email</strong>
                  <a href="mailto:contact@livraison.ne">contact@livraison.ne</a>
                </div>
              </div>
              <div className="ft-contact-item">
                <span>📍</span>
                <div>
                  <strong>Ville</strong>
                  <span>Niamey, Niger</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="ft-bottom">
          <p>© {year} SwiftLivraison. Tous droits réservés.</p>
          <div className="ft-bottom-links">
            <a href="#">Conditions d'utilisation</a>
            <a href="#">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
