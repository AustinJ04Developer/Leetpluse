import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Sliders, Save, CheckCircle2, CreditCard } from 'lucide-react';

const BrandingBillingPage = () => {
  const [companyName, setCompanyName] = useState('TechCorp Academy');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [plan, setPlan] = useState('Enterprise');
  const [msg, setMsg] = useState('');

  const loadOrg = async () => {
    try {
      const res = await api.get('/superadmin/org-analytics');
      if (res.data.success && res.data.organization) {
        const org = res.data.organization;
        setCompanyName(org.branding?.companyName || 'TechCorp Academy');
        setPrimaryColor(org.branding?.primaryColor || '#6366f1');
        setPlan(org.plan || 'Enterprise');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.put('/superadmin/branding', {
        companyName,
        primaryColor,
        plan
      });
      if (res.data.success) {
        setMsg('Organization branding and billing plan updated!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Branding & Billing Plan</h1>
        <p className="text-xs text-slate-400">Configure white-label branding, custom domain & subscription tier</p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {msg}
        </div>
      )}

      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Theme Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-36 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Plan Tier</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="Basic">Basic Plan (Up to 50 users)</option>
              <option value="Pro">Pro Plan (Up to 250 users)</option>
              <option value="Enterprise">Enterprise Unlimited Plan (Dedicated Sync & Support)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Save Branding Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandingBillingPage;
