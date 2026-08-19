'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  FileText,
  CreditCard,
  Zap,
  Lock,
  Smartphone,
  Headphones,
  BadgeCheck,
  Mail,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatTaka, DEMO_BANNER_TEXT } from '@/lib/constants';
import { toast } from 'sonner';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const steps = [
  { step: 1, title: 'Create Demo Account', description: 'Get instant access with a simulated demo account — no real data needed.', icon: ShieldCheck },
  { step: 2, title: 'Verify Identity', description: 'Upload documents for simulated identity verification.', icon: FileText },
  { step: 3, title: 'Choose a Plan', description: 'Browse available loan plans and select one that fits your needs.', icon: CreditCard },
  { step: 4, title: 'Receive & Repay', description: 'Loan amount is credited to your demo balance. Manage repayments easily.', icon: Clock },
];

const features = [
  { title: 'Instant Disbursement', description: 'Loan amounts are credited to your demo balance immediately upon approval.', icon: Zap },
  { title: 'Secure Platform', description: 'All data is encrypted and processed securely. Demo mode keeps you safe.', icon: Lock },
  { title: 'Mobile Friendly', description: 'Full functionality on any device — manage loans from your phone.', icon: Smartphone },
  { title: 'Flexible Plans', description: 'Multiple loan plans with varying amounts and interest rates to choose from.', icon: CreditCard },
  { title: 'Real-time Tracking', description: 'Track every transaction, repayment, and notification in real-time.', icon: Clock },
  { title: '24/7 Support', description: 'Get help through our support ticket system anytime you need assistance.', icon: Headphones },
];

const faqs = [
  { question: 'Is this a real loan platform?', answer: 'No. Kisti is a demonstration/simulation platform. No real money, loans, or financial transactions are processed. Everything is simulated for demonstration purposes.' },
  { question: 'Do I need to provide real personal information?', answer: 'No. All data is generated for demonstration purposes. You do not need to provide any real personal information.' },
  { question: 'How does the demo balance work?', answer: 'When your loan application is approved in the demo, the principal amount is credited to your simulated balance. Repayments deduct from this balance.' },
  { question: 'Can I reset my demo account?', answer: 'Contact the administrator through the support system to request an account reset. A new demo session will be created for you.' },
  { question: 'Is my data stored?', answer: 'Demo data is stored in a local database for the duration of the session. No data is shared with third parties.' },
];

interface Plan {
  id: string;
  name: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  principalFormatted: string;
  interestFormatted: string;
  totalFormatted: string;
  interestRate: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [gettingStarted, setGettingStarted] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPlans(json.data);
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  const handleGetStarted = async () => {
    setGettingStarted(true);
    try {
      const res = await fetch('/api/demo/session', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        router.push('/dashboard');
      } else {
        toast.error(json.error || 'Failed to create demo session');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setGettingStarted(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@kisti.demo', password: 'admin123' }),
      });
      const json = await res.json();
      if (json.success) {
        setLoginOpen(false);
        toast.success('Admin login successful');
        router.push(json.data.role === 'ADMIN' ? '/admin' : '/dashboard');
      } else {
        toast.error(json.error || 'Login failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setContactSending(false);
    setContactForm({ name: '', email: '', message: '' });
    toast.success('Message sent! (Demo — no real message was sent)');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Demo Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-medium">{DEMO_BANNER_TEXT}</p>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-lg">Kisti</span>
            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 hidden sm:inline-flex">DEMO</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>
              Admin Login
            </Button>
            <Button size="sm" onClick={handleGetStarted} disabled={gettingStarted} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {gettingStarted ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto text-center">
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-6 border-emerald-300 text-emerald-700 bg-emerald-50">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
                  Simulation Platform — No Real Money
                </Badge>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Simple & Flexible{' '}
                <span className="text-emerald-600">Kisti</span>{' '}
                Management
              </motion.h1>
              <motion.p variants={fadeInUp} className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Manage your demo application, balance and installment schedule from one modern dashboard.
              </motion.p>
              <motion.div variants={fadeInUp} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleGetStarted} disabled={gettingStarted} className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 text-base">
                  {gettingStarted && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => setLoginOpen(true)} className="h-12 px-8 text-base">
                  Login
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-12">
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold">How It Works</motion.h2>
              <motion.p variants={fadeInUp} className="mt-3 text-muted-foreground">Get started in four simple steps</motion.p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.step} variants={fadeInUp}>
                    <Card className="text-center p-6 rounded-xl hover:shadow-md transition-shadow h-full border">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 mb-1">STEP {item.step}</div>
                      <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Demo Plans */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-12">
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold">Demo Loan Plans</motion.h2>
              <motion.p variants={fadeInUp} className="mt-3 text-muted-foreground">Explore available loan plans (simulation only)</motion.p>
            </motion.div>
            {plansLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 rounded-xl"><Skeleton className="h-6 w-24 mb-4" /><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-3/4" /></Card>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No plans available at the moment.</div>
            ) : (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <motion.div key={plan.id} variants={fadeInUp}>
                    <Card className="p-6 rounded-xl hover:shadow-md transition-shadow h-full border">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 mb-3">DEMO PLAN</Badge>
                      <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                      <div className="text-3xl font-bold text-emerald-600 mb-4">{plan.principalFormatted}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between"><span>Interest ({plan.interestRate})</span><span className="font-medium text-foreground">{plan.interestFormatted}</span></div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium"><span>Total Repayable</span><span className="text-foreground">{plan.totalFormatted}</span></div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-12">
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold">Why Kisti?</motion.h2>
              <motion.p variants={fadeInUp} className="mt-3 text-muted-foreground">Built for clarity, speed, and simplicity</motion.p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <motion.div key={feat.title} variants={fadeInUp}>
                    <Card className="p-6 rounded-xl hover:shadow-md transition-shadow h-full border">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold mb-2">{feat.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-12">
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold">Frequently Asked Questions</motion.h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeInUp}>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`} className="bg-white rounded-xl border px-4 data-[state=open]:shadow-sm">
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-8">
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold">Get In Touch</motion.h2>
              <motion.p variants={fadeInUp} className="mt-3 text-muted-foreground">Have questions? Send us a message (demo only)</motion.p>
            </motion.div>
            <motion.form initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeInUp} onSubmit={handleContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input id="contact-name" placeholder="Your name" value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input id="contact-email" type="email" placeholder="you@example.com" value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea id="contact-message" placeholder="How can we help?" rows={4} value={contactForm.message} onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))} required />
              </div>
              <Button type="submit" disabled={contactSending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {contactSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
            </motion.form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">K</span>
              </div>
              <span className="font-semibold text-white text-sm">Kisti</span>
            </div>
            <p className="text-xs text-center sm:text-right max-w-md">
              This is a demonstration platform. No real financial transactions are processed. All data is simulated for educational and demonstration purposes only.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription>This is the admin login for managing the demo platform.</DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <strong>Demo credentials:</strong> admin@kisti.demo / admin123
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminLogin} disabled={loginLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}