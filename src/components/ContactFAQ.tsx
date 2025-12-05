import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

const ContactFAQ: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I start selling on Coach2Coach?',
      answer: 'Simply create an account, set up your seller profile, and start uploading your coaching resources. Our team will review your content to ensure quality, and once approved, your resources will be available for purchase.'
    },
    {
      question: 'What commission rates do you charge?',
      answer: 'Our commission rates vary by membership tier: Free accounts pay 50%, Premium members pay 20%, and Pro members pay only 10% commission on sales.'
    },
    {
      question: 'What types of resources can I sell?',
      answer: 'You can sell any coaching-related content including practice plans, drill guides, playbooks, training videos, strategy documents, player development programs, and more.'
    },
    {
      question: 'How and when do I get paid?',
      answer: 'Payments are processed monthly via your preferred method (PayPal, direct deposit, etc.). You can track your earnings in real-time through your seller dashboard.'
    },
    {
      question: 'Is there a review process for uploaded content?',
      answer: 'Yes, all content goes through our quality review process to ensure it meets our standards and provides value to coaches. This typically takes 1-3 business days.'
    },
    {
      question: 'Can I offer both free and paid resources?',
      answer: 'Absolutely! Many coaches use free resources to build their following and showcase their expertise, then offer premium paid content for deeper value.'
    },
    {
      question: 'What support do you provide to sellers?',
      answer: 'We provide comprehensive seller support including marketing assistance, best practice guides, community forums, and dedicated customer service for Premium and Pro members.'
    },
    {
      question: 'Can I customize my seller profile?',
      answer: 'Yes! You can customize your profile with your bio, coaching experience, school/team branding, colors, and images to build your coaching brand.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Section */}
          <div id="contact">
            <h2 className="text-4xl font-bold text-slate-900 mb-8">
              Get in <span className="text-emerald-600">Touch</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Have questions about selling, buying, or using our platform? We're here to help you succeed.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Email Us</h4>
                  <a href="mailto:zach@coach2coachnetwork.com" className="text-emerald-600 hover:text-emerald-700">
                    zach@coach2coachnetwork.com
                  </a>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Call Us</h4>
                  <a href="tel:6783435084" className="text-emerald-600 hover:text-emerald-700">
                    678-343-5084
                  </a>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Live Chat</h4>
                  <p className="text-gray-600">Available Mon-Fri 9AM-6PM EST</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Send us a message</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="First Name"
                    className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Last Name"
                    className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea 
                  placeholder="Your Message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-8">
              Frequently Asked <span className="text-emerald-600">Questions</span>
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-900">{faq.question}</span>
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactFAQ;