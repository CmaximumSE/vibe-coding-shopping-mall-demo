import { memo } from 'react';
import { Link } from 'react-router-dom';

const footerLinks = {
  shop: [
    { name: 'Women', to: '/women' },
    { name: 'Men', to: '/men' },
    { name: 'Kids', to: '/kids' },
    { name: 'Sale', to: '/sale' }
  ],
  help: [
    { name: 'Customer Service', to: '/customer-service' },
    { name: 'Shipping', to: '/shipping' },
    { name: 'Returns', to: '/returns' },
    { name: 'Size Guide', to: '/size-guide' }
  ],
  company: [
    { name: 'About Us', to: '/about' },
    { name: 'Careers', to: '/careers' },
    { name: 'Sustainability', to: '/sustainability' },
    { name: 'Contact', to: '/contact' }
  ]
};

const LinkSection = ({ title, links }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <ul className="space-y-2 text-gray-400">
      {links.map((link) => (
        <li key={link.name}>
          <Link to={link.to} className="hover:text-white transition-colors">
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = memo(function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ATELIER */}
          <div>
            <h3 className="text-xl font-bold mb-4">ATELIER</h3>
            <p className="text-gray-400">Redefining modern elegance through timeless design</p>
          </div>

          {/* SHOP */}
          <LinkSection title="SHOP" links={footerLinks.shop} />

          {/* HELP */}
          <LinkSection title="HELP" links={footerLinks.help} />

          {/* COMPANY */}
          <LinkSection title="COMPANY" links={footerLinks.company} />
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2025 Atelier. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;