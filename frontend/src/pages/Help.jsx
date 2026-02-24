import React, { useState } from 'react';
import { HelpCircle, Search, BookOpen, MessageCircle, Video, FileText, ChevronRight, ExternalLink } from 'lucide-react';
import { HelpTooltip } from '../components/ContextualHelp';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'How do I add a new transaction?',
      answer: 'Navigate to the Dashboard and use the transaction form at the top of the page. Fill in the date, description, amount, and select the appropriate category.',
    },
    {
      question: 'What is double-entry bookkeeping?',
      answer: 'Double-entry bookkeeping is a system where every transaction affects at least two accounts - one is debited and another is credited. This ensures your books always balance.',
    },
    {
      question: 'How do I generate a VAT report?',
      answer: 'Go to Reports → Tax Report. Select your reporting period and the system will calculate your VAT obligations based on your recorded transactions.',
    },
    {
      question: 'Can I import bank statements?',
      answer: 'Yes! Go to Import/Export and select the MT940 format to import Swiss bank statements. You can also import CSV files from other banks.',
    },
    {
      question: 'How do I add a new team member?',
      answer: 'Navigate to Settings → Users & Access and click "Invite User". Enter their email and select their role (Admin, Accountant, or Viewer).',
    },
  ];

  const resources = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of SwissBooks in 10 minutes',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      icon: Video,
      color: 'bg-rose-50 text-rose-600',
    },
    {
      title: 'API Documentation',
      description: 'Integrate with our REST API',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: MessageCircle,
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Help Center</h1>
        <p className="text-slate-600">Find answers and get support</p>
      </div>

      {/* Search */}
      <div className="bg-indigo-600 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-semibold text-white text-center mb-4">How can we help you?</h2>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-12 pr-4 py-3 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white focus:outline-none"
          />
        </div>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <div
              key={resource.title}
              className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className={`w-10 h-10 ${resource.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-slate-600">{resource.description}</p>
            </div>
          );
        })}
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Frequently Asked Questions
          </h2>
          <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
              <h3 className="font-medium text-slate-900 mb-2">{faq.question}</h3>
              <p className="text-slate-600 text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Card */}
      <div className="mt-8 bg-slate-900 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Still need help?</h3>
            <p className="text-slate-400">Our support team is available Monday-Friday, 9am-6pm CET</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium">
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Live Chat
            </button>
            <button className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors">
              <ExternalLink className="w-4 h-4 inline mr-2" />
              Email Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
