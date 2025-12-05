import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Logo className="w-10 h-10" />
              <div>
                <h3 className="text-xl font-bold">Coach2Coach</h3>
                <p className="text-sm text-gray-400">Made for Coaches, by Coaches</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              The premier digital marketplace where coaching expertise meets opportunity.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="/browse" className="text-gray-400 hover:text-white transition-colors">Browse Resources</a></li>
              <li><a href="/become-seller" className="text-gray-400 hover:text-white transition-colors">Become a Seller</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="/community-hub" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/legal/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/legal/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/legal/copyright" className="text-gray-400 hover:text-white transition-colors">Copyright Policy</a></li>
              <li><a href="/legal/dmca" className="text-gray-400 hover:text-white transition-colors">DMCA Policy</a></li>
              <li><a href="/legal/refund" className="text-gray-400 hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-emerald-400 mr-3" />
                <a href="mailto:zach@coach2coachnetwork.com" className="text-gray-400 hover:text-white transition-colors">
                  zach@coach2coachnetwork.com
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-emerald-400 mr-3" />
                <a href="tel:6783435084" className="text-gray-400 hover:text-white transition-colors">
                  678-343-5084
                </a>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-emerald-400 mr-3 mt-1" />
                <span className="text-gray-400">
                  Coach2Coach Network, LLC<br />
                  Atlanta, GA
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Coach2Coach Network, LLC. All rights reserved.
            </p>
            <p className="text-emerald-400 font-semibold mt-2 md:mt-0">
              Where Coaches Get Paid
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;