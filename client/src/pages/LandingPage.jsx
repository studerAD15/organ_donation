import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import logo from "../assets/lifegive_logo.svg";

const GlobeSection = lazy(() => import("../components/GlobeSection"));

// â”€â”€ Animation variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

// â”€â”€ Static data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const stats = [
  { value: "12,500+", label: "Registered Donors", icon: "🩸", color: "text-blood" },
  { value: "4,200+", label: "Lives Saved", icon: "❤️", color: "text-red-500" },
  { value: "180+", label: "Partner Hospitals", icon: "🏥", color: "text-organ" },
  { value: "98%", label: "Match Success Rate", icon: "✅", color: "text-safe" },
];

const howItWorks = [
  {
    step: "01",
    title: "Register & Verify",
    desc: "Sign up as a donor or hospital. Upload your ID proof. Our team verifies within 24 hours.",
    icon: "📝",
    color: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800",
    accent: "text-blood",
  },
  {
    step: "02",
    title: "Smart Matching",
    desc: "Our AI engine matches donors with recipients by blood type, proximity, urgency, and availability.",
    icon: "🧠",
    color: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    accent: "text-organ",
  },
  {
    step: "03",
    title: "Instant Alerts",
    desc: "Verified donors get real-time SMS, push, and in-app notifications the moment a match is found.",
    icon: "🔔",
    color: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800",
    accent: "text-safe",
  },
];

const organs = [
  { name: "Kidney", icon: "🫘", donors: "3,200+" },
  { name: "Liver", icon: "🫀", donors: "1,800+" },
  { name: "Heart", icon: "❤️", donors: "420+" },
  { name: "Eyes", icon: "👁️", donors: "5,600+" },
  { name: "Blood", icon: "🩸", donors: "12,500+" },
  { name: "Lungs", icon: "🫁", donors: "290+" },
];

const testimonials = [
  {
    quote: "LifeLink matched my father with a kidney donor within 48 hours. The platform is a miracle.",
    name: "Priya Sharma",
    role: "Recipient Family",
    avatar: "PS",
    color: "bg-blood",
  },
  {
    quote: "As a doctor, I've seen first-hand how fast this platform operates in critical situations.",
    name: "Dr. Arun Mehta",
    role: "Nephrologist, AIIMS Delhi",
    avatar: "AM",
    color: "bg-organ",
  },
  {
    quote: "Registered in 5 minutes. Got my first match notification in 2 days. Simple and impactful.",
    name: "Rahul Verma",
    role: "Blood Donor",
    avatar: "RV",
    color: "bg-safe",
  },
];

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LandingPage = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="overflow-x-hidden">
      {/* â•â•â• HERO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blood/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-organ/15 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-red-900/10 blur-[80px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Big front-page logo */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-6 inline-flex items-center justify-center gap-3 px-4 py-2 rounded-3xl bg-white/5 border border-white/10"
          >
            <img src={logo} alt="LifeLink logo" className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover shadow-lg shadow-blood/25" />
            <div className="text-left">
              <div className="text-4xl sm:text-5xl font-display font-extrabold text-white leading-none tracking-tight">
                Life<span className="text-blood">Link</span>
              </div>
              <div className="mt-1 text-sm text-slate-300 font-medium">Organ Donation Portal</div>
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blood/20 border border-blood/30 text-blood text-xs font-semibold uppercase tracking-widest mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blood animate-pulse" />
            India's Most Trusted Organ Donation Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-display font-extrabold text-white leading-[1.1] tracking-tight"
          >
            Give the Gift of{" "}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">Life</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blood to-red-400 rounded-full origin-left"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            Real-time, AI-powered matching between organ donors and hospitals across India.
            Every second matters. Every donation saves a life.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-4 justify-center"
          >
            <Link
              to="/register"
              className="group px-8 py-4 rounded-2xl bg-blood hover:bg-red-700 text-white font-bold text-base shadow-2xl shadow-blood/40 hover:shadow-blood/60 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-2"
            >
              🩸 Become a Donor
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-bold text-base transition-all hover:-translate-y-1"
            >
              🏥 Hospital Login
            </Link>
            <Link
              to="/requests"
              className="px-8 py-4 rounded-2xl border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold text-base transition-all hover:-translate-y-1"
            >
              View Live Requests →
            </Link>
          </motion.div>

          {/* Floating stat pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-14 flex flex-wrap justify-center gap-3"
          >
            {[
              { label: "12,500+ Donors", dot: "bg-red-400" },
              { label: "Live Matching", dot: "bg-green-400 animate-pulse" },
              { label: "24/7 Alerts", dot: "bg-blue-400" },
            ].map((pill) => (
              <span key={pill.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/10 text-white/80 text-sm">
                <span className={`w-2 h-2 rounded-full ${pill.dot}`} />
                {pill.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* â•â•â• STATS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <div className="text-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow group">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <div className={`text-3xl font-extrabold font-display ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* â•â•â• 3D GLOBE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10"
          >
            <span className="text-blood text-xs font-bold uppercase tracking-widest">Live Network</span>
            <h2 className="mt-2 text-4xl font-display font-bold text-white">
              Connecting Lives Across India
            </h2>
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">
              Watch real-time organ donation connections forming across the country. Each arc represents a life being saved.
            </p>
          </motion.div>

          <Suspense fallback={
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blood border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Loading Globe...</p>
              </div>
            </div>
          }>
            {mounted && <GlobeSection />}
          </Suspense>
        </div>
      </section>

      {/* â•â•â• HOW IT WORKS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-blood text-xs font-bold uppercase tracking-widest">Simple Process</span>
            <h2 className="mt-2 text-4xl font-display font-bold text-slate-900 dark:text-white">How LifeLink Works</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Three simple steps connect donors with those who need them most
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {howItWorks.map((item) => (
              <motion.div key={item.step} variants={fadeUp}>
                <div className={`rounded-3xl border p-8 h-full hover:shadow-xl transition-all hover:-translate-y-1 ${item.color}`}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className={`text-xs font-black uppercase tracking-widest ${item.accent} mb-2`}>Step {item.step}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* â•â•â• ORGAN TYPES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-organ text-xs font-bold uppercase tracking-widest">What We Support</span>
            <h2 className="mt-2 text-4xl font-display font-bold text-slate-900 dark:text-white">Organ & Blood Donation</h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
          >
            {organs.map((organ) => (
              <motion.div key={organ.name} variants={fadeUp} whileHover={{ scale: 1.05 }}>
                <div className="text-center p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-default">
                  <div className="text-3xl mb-2">{organ.icon}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{organ.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{organ.donors} donors</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* â•â•â• ABOUT / MISSION â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-blood text-xs font-bold uppercase tracking-widest">Our Mission</span>
              <h2 className="mt-3 text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                Technology in Service of Human Life
              </h2>
              <p className="mt-5 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                Every 10 minutes, someone in India is added to the organ transplant waiting list.
                LifeLink exists to close the gap between donors and recipients — using technology, empathy, and speed.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Government ID-verified donor registry",
                  "AI-powered urgency and proximity matching",
                  "Real-time SMS + Socket notifications",
                  "Hospital license validation system",
                  "Complete audit trail for transparency",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-safe flex items-center justify-center text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-4">
                <Link to="/register" className="btn-primary">Join as Donor →</Link>
                <Link to="/requests" className="btn-secondary">See Requests</Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="rounded-3xl bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 p-8 border border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: "⏱️", title: "< 2 min", subtitle: "Avg. match time" },
                    { icon: "🔒", title: "100%", subtitle: "Secure & verified" },
                    { icon: "📡", title: "Real-time", subtitle: "Notifications" },
                    { icon: "🌍", title: "Pan-India", subtitle: "Network" },
                  ].map((item) => (
                    <div key={item.title} className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-center">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.subtitle}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-2xl bg-blood/5 border border-blood/10 text-center">
                  <p className="text-blood font-bold text-2xl">500,000+</p>
                  <p className="text-slate-500 text-sm mt-1">People on India's transplant waiting list</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* â•â•â• TESTIMONIALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-blood text-xs font-bold uppercase tracking-widest">Real Stories</span>
            <h2 className="mt-2 text-3xl font-display font-bold text-white">Lives Changed</h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <div className="h-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-2xl mb-4">"</div>
                  <p className="text-slate-300 leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{t.name}</div>
                      <div className="text-slate-400 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* â•â•â• CTA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-24 bg-gradient-to-r from-blood via-red-700 to-red-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-extrabold text-white leading-tight">
              One Decision Can Save Eight Lives
            </h2>
            <p className="mt-4 text-red-100 text-lg">
              Pledge your organs today. It costs nothing. It means everything.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register" className="px-10 py-4 rounded-2xl bg-white text-blood font-bold text-base hover:bg-red-50 transition-all shadow-2xl hover:-translate-y-1">
                Register Now — It's Free
              </Link>
              <Link to="/map" className="px-10 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-base transition-all hover:-translate-y-1">
                View Donor Map
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
