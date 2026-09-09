import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  Menu,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import { useState } from 'react';

const workflow = [
  {
    icon: MapPin,
    number: '01',
    title: 'Plan every territory',
    description: 'Organize doctors by headquarters such as North Delhi, Noida, Ghaziabad, and more.',
  },
  {
    icon: Stethoscope,
    number: '02',
    title: 'Capture the real visit',
    description: 'Log the doctor, clinic, location, and visit details while you are in the field.',
  },
  {
    icon: ClipboardCheck,
    number: '03',
    title: 'Submit a complete DCR',
    description: 'Record products, quantities, value, remarks, feedback, and follow-up actions in one place.',
  },
];

const benefits = [
  'Faster, cleaner daily reporting',
  'One source of truth for every territory',
  'Live visibility for managers',
  'Secure role-based access',
];

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7faff] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-slate-950/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">Artemis</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-blue-200">Field intelligence</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#workflow" className="transition hover:text-white">How it works</a>
            <a href="#capabilities" className="transition hover:text-white">Capabilities</a>
            <a href="#teams" className="transition hover:text-white">For your team</a>
            <Link to="/login" className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/10">
              Sign in
            </Link>
          </nav>

          <button className="rounded-xl p-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-slate-800 bg-slate-950 px-5 py-4 md:hidden">
            <div className="flex flex-col gap-4 text-sm text-slate-300">
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a href="#capabilities" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
              <Link to="/login" className="font-semibold text-white">Sign in <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-slate-950 pb-20 pt-36 text-white lg:pb-28 lg:pt-44">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.12)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="absolute -left-32 top-40 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="absolute -right-24 top-20 h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
            <div className="artemis-fade-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.15)]" />
                Built for modern medical field teams
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Every doctor visit.
                <span className="block text-blue-400">Captured with clarity.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Artemis gives medical representatives a simple way to plan territories, record doctor calls, and report product activity—while managers get the visibility to lead better.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400">
                  Start reporting <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#workflow" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:bg-white/5">
                  See how it works <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Mobile-first field workflow</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Built for dermatology teams</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg artemis-fade-up" style={{ animationDelay: '160ms' }}>
              <div className="artemis-pulse-soft absolute -inset-5 rounded-[2rem] bg-blue-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=85"
                  alt="Dermatologist consulting with a patient in a clinic"
                  className="h-80 w-full rounded-[1.5rem] object-cover opacity-90 sm:h-[26rem]"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl artemis-fade-up">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">A better daily rhythm</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From first call to final report, without the paperwork.</h2>
            <p className="mt-4 text-base leading-7 text-slate-500">Artemis follows the way representatives already work in the field and turns each visit into useful, structured business data.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {workflow.map((item, index) => {
              const Icon = item.icon;
              return <div key={item.number} className="artemis-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/50" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-blue-600">{item.number}</span><span className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Icon className="h-5 w-5" /></span></div>
                <h3 className="mt-8 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>;
            })}
          </div>
        </section>

        <section id="capabilities" className="bg-white py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-2 lg:items-center lg:px-8">
            <div className="artemis-fade-up relative overflow-hidden rounded-[2rem] bg-slate-900 p-3">
              <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85" alt="Doctor reviewing healthcare information" className="h-[28rem] w-full rounded-[1.5rem] object-cover opacity-75" />
              <div className="absolute bottom-8 left-8 rounded-2xl border border-white/20 bg-slate-950/85 p-4 text-white backdrop-blur">
                <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-blue-400" /><span className="text-sm font-semibold">Actionable field intelligence</span></div>
                <p className="mt-2 text-xs text-slate-400">Visits, products, value, and feedback in one view.</p>
              </div>
            </div>
            <div className="artemis-fade-up" style={{ animationDelay: '140ms' }}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Designed for the whole team</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A field app reps enjoy using. A dashboard managers can trust.</h2>
              <p className="mt-5 text-base leading-7 text-slate-500">Replace scattered notes and end-of-week data chasing with a shared operating system for your doctor engagement program.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => <div key={benefit} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />{benefit}</div>)}
              </div>
              <Link to="/login" className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">Explore Artemis <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section id="teams" className="mx-5 my-20 overflow-hidden rounded-[2rem] bg-blue-600 px-6 py-14 text-white shadow-2xl shadow-blue-200 sm:px-12 lg:mx-auto lg:max-w-7xl lg:py-20">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl"><ShieldCheck className="h-8 w-8 text-blue-200" /><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Make every territory more productive.</h2><p className="mt-4 max-w-xl leading-7 text-blue-100">Give your representatives less admin and your leadership better decisions. Artemis keeps the work moving from the first doctor visit to the final review.</p></div>
            <Link to="/login" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50">Get started <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="font-semibold text-slate-800">Artemis Formulation</div>
          <div>Dermatology field sales intelligence & reporting</div>
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Sign in <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
        </div>
      </footer>
    </div>
  );
};
