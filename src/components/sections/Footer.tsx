import React from 'react';
import { Twitter, Linkedin, Instagram } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'For Operators', href: '#operators' },
    { label: 'Join Waitlist', href: '#waitlist' },
  ],
  company: [
    { label: 'Contact', href: 'mailto:hello@krowdguide.com' },
    { label: 'Request a Demo', href: '#waitlist' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const Footer: React.FC = () => {
  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="relative bg-krowd-bg border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Logo & Tagline */}
          <div className="lg:col-span-2">
            <a
              href="#"
              className="font-display font-bold text-xl text-krowd-text-primary tracking-tight inline-block mb-4"
            >
              Krowd<span className="text-krowd-accent">Guide</span>
            </a>
            <p className="body-text text-sm max-w-xs mb-6">
              Crowd intelligence for public spaces. Built in Dallas, Texas.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-krowd-text-secondary hover:bg-krowd-accent/20 hover:text-krowd-accent transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-krowd-text-secondary hover:bg-krowd-accent/20 hover:text-krowd-accent transition-colors"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-krowd-text-secondary hover:bg-krowd-accent/20 hover:text-krowd-accent transition-colors"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-display font-semibold text-krowd-text-primary text-sm mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="body-text text-sm hover:text-krowd-accent transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display font-semibold text-krowd-text-primary text-sm mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('mailto') ? (
                    <a
                      href={link.href}
                      className="body-text text-sm hover:text-krowd-accent transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="body-text text-sm hover:text-krowd-accent transition-colors"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display font-semibold text-krowd-text-primary text-sm mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="body-text text-sm hover:text-krowd-accent transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-krowd-text-secondary/60">
            © 2026 Krowd Guide LLC. All rights reserved.
          </p>
          <p className="text-xs text-krowd-text-secondary/60">
            We use essential cookies only. Analytics are cookie-free.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
