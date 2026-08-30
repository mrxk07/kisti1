'use client'

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Toaster, toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Landmark, LayoutDashboard, FileText, ArrowRight, ArrowRightLeft,
  Bell, User, LogOut, Shield, Users, ClipboardList, CreditCard,
  Megaphone, LifeBuoy, BarChart3, CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronLeft, Menu, X, Wallet, TrendingUp, Eye, EyeOff,
  Plus, Send, Search, Package, CircleDollarSign
} from 'lucide-react'
import { formatTaka, formatDate } from '@/lib/bn'

// ==================== TYPES ====================
interface AppUser {
  id: string
  name: string
  mobile: string
  email: string | null
  role: string
}

interface AppState {
  user: AppUser | null
  loading: boolean
  view: string
  dashTab: string
  adminTab: string
  mobileMenuOpen: boolean
}

// ==================== CONTEXT ====================
const AppContext = createContext<{
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  handleLogout: () => Promise<void>
  refreshSession: () => Promise<void>
} | null>(null)

function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppContext')
  return ctx
}

// ==================== STATUS MAP ====================
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'অপেক্ষমাণ', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
  VERIFYING: { label: 'যাচাই চলছে', color: 'bg-blue-100 text-blue-800', icon: <Search className="h-3 w-3" /> },
  APPROVED: { label: 'অনুমোদিত', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: 'প্রত্যাখ্যাত', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
  COMPLETED: { label: 'সম্পন্ন', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle2 className="h-3 w-3" /> },
  PAID: { label: 'পরিশোধিত', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
  OVERDUE: { label: 'বকেয়া', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3 w-3" /> },
  OPEN: { label: 'খোলা', color: 'bg-blue-100 text-blue-800', icon: <CircleDollarSign className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'প্রক্রিয়াধীন', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3" /> },
  RESOLVED: { label: 'সমাধান হয়েছে', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
  CLOSED: { label: 'বন্ধ', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-3 w-3" /> }
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: null }
  return (
    <Badge variant="secondary" className={`${s.color} border-0 gap-1 text-xs`}> {s.icon} {s.label}</Badge>
  )
}

// ==================== SKELETON ====================
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

// ==================== LANDING PAGE ====================
function LandingPage() {
  const { setState } = useApp()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-800">কিস্তি</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setState(s => ({ ...s, view: 'login' }))}>
              লগইন
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setState(s => ({ ...s, view: 'register' }))}>
              নিবন্ধন করুন
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 border-emerald-200 text-emerald-700 bg-emerald-50">
            <TrendingUp className="h-3 w-3 mr-1" /> সহজ ঋণ ব্যবস্থাপনা
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            সহজেই ঋণ নিন,<br />
            <span className="text-emerald-600">সহজেই পরিশোধ করুন</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            কিস্তি হলো আপনার ঋণ ব্যবস্থাপনার সেরা সঙ্গী। সহজ আবেদন প্রক্রিয়া, স্বচ্ছ শর্তাবলী এবং দ্রুত অনুমোদন।
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base px-8" onClick={() => setState(s => ({ ...s, view: 'register' }))}>
              শুরু করুন <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
              প্ল্যান দেখুন
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <FileText className="h-6 w-6" />, title: 'সহজ আবেদন', desc: 'কয়েক মিনিটে অনলাইনে আবেদন করুন' },
            { icon: <Shield className="h-6 w-6" />, title: 'নিরাপদ লেনদেন', desc: 'আপনার তথ্য সম্পূর্ণ নিরাপদ' },
            { icon: <CreditCard className="h-6 w-6" />, title: 'স্বচ্ছ কিস্তি', desc: 'প্রতিটি কিস্তির বিস্তারিত দেখুন' },
            { icon: <TrendingUp className="h-6 w-6" />, title: 'দ্রুত অনুমোদন', desc: 'দ্রুত যাচাই এবং অনুমোদন প্রক্রিয়া' }
          ].map((f, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">কিস্তির পরিকল্পনা</h2>
          <p className="text-gray-500">আপনার প্রয়োজন অনুযায়ী পরিকল্পনা বেছে নিন</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: 'বেসিক', amount: 5650, interest: 500, total: 6150, installments: 3 },
            { name: 'স্ট্যান্ডার্ড', amount: 12550, interest: 1352, total: 13902, installments: 6, popular: true },
            { name: 'প্রিমিয়াম', amount: 25000, interest: 2200, total: 27200, installments: 12 }
          ].map((plan, i) => (
            <Card key={i} className={`relative ${plan.popular ? 'border-emerald-500 border-2 shadow-lg' : 'shadow-sm'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white">জনপ্রিয়</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <div className="text-3xl font-bold text-emerald-700">{formatTaka(plan.amount)}</div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>সুদ: {formatTaka(plan.interest)}</p>
                  <p>মোট পরিশোধযোগ্য: {formatTaka(plan.total)}</p>
                  <p>কিস্তি: {plan.installments} মাস</p>
                  <p>মাসিক কিস্তি: {formatTaka(plan.total / plan.installments)}</p>
                </div>
                <Button
                  className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => setState(s => ({ ...s, view: 'register' }))}
                >
                  আবেদন করুন
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          <p>© ২০২৬ কিস্তি। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  )
}

// ==================== LOGIN PAGE ====================
function LoginPage() {
  const { setState, refreshSession } = useApp()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      toast.success(data.message || 'লগইন সফল!')
      await refreshSession()
    } catch {
      setError('দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 mx-auto mb-3 bg-emerald-600 rounded-2xl flex items-center justify-center">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">লগইন করুন</CardTitle>
          <CardDescription>আপনার একাউন্টে প্রবেশ করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="identifier">মোবাইল নম্বর / ইমেইল</Label>
              <Input
                id="identifier"
                placeholder="01XXXXXXXXX"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="পাসওয়ার্ড দিন"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? 'লোড হচ্ছে...' : 'লগইন'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            একাউন্ট নেই?{' '}
            <button className="text-emerald-600 font-medium hover:underline" onClick={() => setState(s => ({ ...s, view: 'register' }))}>
              নিবন্ধন করুন
            </button>
          </div>
          <div className="mt-2 text-center">
            <button className="text-sm text-gray-400 hover:text-gray-600" onClick={() => setState(s => ({ ...s, view: 'landing' }))}>
              <ChevronLeft className="h-4 w-4 inline" /> ফিরে যান
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== REGISTER PAGE ====================
function RegisterPage() {
  const { setState, refreshSession } = useApp()
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('পাসওয়ার্ড দুইবার একই হতে হবে।')
      setLoading(false)
      return
    }
    if (form.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, mobile: form.mobile, email: form.email || undefined, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      toast.success(data.message || 'নিবন্ধন সফল!')
      await refreshSession()
    } catch {
      setError('দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    } finally { setLoading(false) }
  }

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 mx-auto mb-3 bg-emerald-600 rounded-2xl flex items-center justify-center">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">নিবন্ধন করুন</CardTitle>
          <CardDescription>নতুন একাউন্ট তৈরি করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>
            )}
            <div className="space-y-1">
              <Label htmlFor="name">নাম</Label>
              <Input id="name" placeholder="আপনার পূর্ণ নাম" value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mobile">মোবাইল নম্বর</Label>
              <Input id="mobile" placeholder="01XXXXXXXXX" value={form.mobile} onChange={e => update('mobile', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">ইমেইল <span className="text-gray-400 text-xs">(ঐচ্ছিক)</span></Label>
              <Input id="email" type="email" placeholder="example@mail.com" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <div className="relative">
                <Input id="password" type={showPass ? 'text' : 'password'} placeholder="কমপক্ষে ৬ অক্ষর" value={form.password} onChange={e => update('password', e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input id="confirmPassword" type="password" placeholder="পাসওয়ার্ড আবার দিন" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? 'লোড হচ্ছে...' : 'নিবন্ধন করুন'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            একাউন্ট আছে?{' '}
            <button className="text-emerald-600 font-medium hover:underline" onClick={() => setState(s => ({ ...s, view: 'login' }))}>
              লগইন করুন
            </button>
          </div>
          <div className="mt-2 text-center">
            <button className="text-sm text-gray-400 hover:text-gray-600" onClick={() => setState(s => ({ ...s, view: 'landing' }))}>
              <ChevronLeft className="h-4 w-4 inline" /> ফিরে যান
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== DASHBOARD LAYOUT ====================
function DashboardShell({ children, activeTab, onTabChange, tabs, title }: {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: { id: string; label: string; icon: React.ReactNode }[]
  title: string
}) {
  const { state, setState, handleLogout } = useApp()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setState(s => ({ ...s, mobileMenuOpen: !s.mobileMenuOpen }))}>
              {state.mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Landmark className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-emerald-800 hidden sm:inline">কিস্তি</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium">
                    {state.user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm">{state.user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTabChange('profile')}>
                  <User className="h-4 w-4 mr-2" /> প্রোফাইল
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange('notifications')}>
                  <Bell className="h-4 w-4 mr-2" /> নোটিফিকেশন
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" /> লগআউট
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform lg:translate-x-0 lg:static lg:z-auto top-14
          ${state.mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-3 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); setState(s => ({ ...s, mobileMenuOpen: false })) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <Separator className="my-2" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              লগআউট
            </button>
          </nav>
        </aside>

        {/* Overlay */}
        {state.mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setState(s => ({ ...s, mobileMenuOpen: false }))} />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

// ==================== DASHBOARD OVERVIEW ====================
function DashboardOverview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
  if (!data) return <div className="text-center text-gray-500 py-12">লোড করা যায়নি।</div>

  const activeApp = data.recentApplications?.find((a: any) => a.status === 'APPROVED')
  const nextRepayment = data.upcomingRepayments?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">স্বাগতম, {data.user?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">আজকের সারসংক্ষেপ দেখুন</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">বর্তমান ব্যালেন্স</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatTaka(data.balance || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">মোট আবেদন</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.recentApplications?.length || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">মোট লেনদেন</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalTransactions || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">নতুন নোটিফিকেশন</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.unreadNotifications || 0}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Application */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">চলমান আবেদন</CardTitle>
          </CardHeader>
          <CardContent>
            {activeApp ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">অবস্থা</span>
                  <StatusBadge status={activeApp.status} />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">ঋণের পরিমাণ:</span><p className="font-medium">{formatTaka(activeApp.amount)}</p></div>
                  <div><span className="text-gray-500">সুদ:</span><p className="font-medium">{formatTaka(activeApp.interest)}</p></div>
                  <div><span className="text-gray-500">মোট পরিশোধযোগ্য:</span><p className="font-medium">{formatTaka(activeApp.totalRepayable)}</p></div>
                  <div><span className="text-gray-500">পরবর্তী কিস্তি:</span><p className="font-medium">{nextRepayment ? formatTaka(nextRepayment.amount) : 'নেই'}</p></div>
                </div>
              </div>
            ) : data.recentApplications?.length > 0 ? (
              <div className="space-y-2">
                <StatusBadge status={data.recentApplications[0].status} />
                <p className="text-sm text-gray-500">সাম্প্রতিক আবেদনের অবস্থা দেখুন</p>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">কোনো চলমান আবেদন নেই</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">সাম্প্রতিক লেনদেন</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions?.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.slice(0, 4).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'DISBURSEMENT' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {tx.type === 'DISBURSEMENT' ? <TrendingUp className="h-4 w-4 text-green-600" /> : <ArrowRightLeft className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description || tx.type}</p>
                        <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${tx.type === 'DISBURSEMENT' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'DISBURSEMENT' ? '+' : ''}{formatTaka(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">কোনো লেনদেন পাওয়া যায়নি।</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Repayments */}
      {data.upcomingRepayments?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">আসন্ন কিস্তি</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingRepayments.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">কিস্তি নং {r.installmentNumber}</p>
                    <p className="text-xs text-gray-500">নির্ধারিত: {formatDate(r.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-emerald-700">{formatTaka(r.amount)}</p>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== NEW APPLICATION ====================
function NewApplication() {
  const [plans, setPlans] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [nidNumber, setNidNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/plans').then(r => r.json()).then(d => { setPlans(d.plans || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selected.id,
          amount: selected.amount,
          interest: selected.interest,
          totalRepayable: selected.totalRepayable,
          installmentCount: selected.installmentCount,
          nidNumber: nidNumber || undefined
        })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('আবেদন সফলভাবে জমা হয়েছে!')
      setSelected(null)
      setNidNumber('')
    } catch {
      toast.error('দুঃখিত, একটি সমস্যা হয়েছে।')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">নতুন আবেদন</h2>
        <p className="text-gray-500 text-sm mt-1">একটি ঋণ পরিকল্পনা বেছে নিন এবং আবেদন করুন</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      ) : plans.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan: any) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selected?.id === plan.id ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-0 shadow-sm'}`}
              onClick={() => setSelected(plan)}
            >
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-3">{plan.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">ঋণের পরিমাণ</span><span className="font-medium">{formatTaka(plan.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">সুদ</span><span className="font-medium">{formatTaka(plan.interest)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">মোট</span><span className="font-medium text-emerald-700">{formatTaka(plan.totalRepayable)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">কিস্তি</span><span className="font-medium">{plan.installmentCount} মাস</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>কোনো পরিকল্পনা পাওয়া যায়নি।</p>
        </div>
      )}

      {selected && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>পরিচয় যাচাই</CardTitle>
            <CardDescription>আপনার জাতীয় পরিচয়পত্র নম্বর দিন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nid">NID নম্বর</Label>
              <Input id="nid" placeholder="জাতীয় পরিচয়পত্র নম্বর" value={nidNumber} onChange={e => setNidNumber(e.target.value)} />
              <p className="text-xs text-gray-400">আপনার তথ্য নিরাপদে সংরক্ষণ করা হবে।</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-1">নির্বাচিত পরিকল্পনা: {selected.name}</p>
              <p>ঋণ: {formatTaka(selected.amount)} | সুদ: {formatTaka(selected.interest)} | মোট: {formatTaka(selected.totalRepayable)}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelected(null)}>বাতিল করুন</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== APPLICATIONS LIST ====================
function ApplicationsList() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/applications').then(r => r.json()).then(d => { setApps(d.applications || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">আমার আবেদনসমূহ</h2>
          <p className="text-gray-500 text-sm mt-1">আপনার সকল ঋণ আবেদন এখানে দেখুন</p>
        </div>
      </div>
      {apps.length > 0 ? (
        <div className="space-y-3">
          {apps.map((app: any) => (
            <Card key={app.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{app.plan?.name || 'ঋণ আবেদন'}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(app.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-700">{formatTaka(app.amount)}</p>
                    <p className="text-xs text-gray-500">মোট: {formatTaka(app.totalRepayable)}</p>
                  </div>
                </div>
                {app.rejectionReason && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                    কারণ: {app.rejectionReason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>কোনো আবেদন পাওয়া যায়নি।</p>
        </div>
      )}
    </div>
  )
}

// ==================== TRANSACTIONS LIST ====================
function TransactionsList() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions').then(r => r.json()).then(d => { setTransactions(d.transactions || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">লেনদেন</h2>
        <p className="text-gray-500 text-sm mt-1">আপনার সকল লেনদেনের তালিকা</p>
      </div>
      {transactions.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'DISBURSEMENT' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {tx.type === 'DISBURSEMENT' ? <TrendingUp className="h-5 w-5 text-green-600" /> : <ArrowRightLeft className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.type === 'DISBURSEMENT' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'DISBURSEMENT' ? '+' : '-'}{formatTaka(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>কোনো লেনদেন পাওয়া যায়নি।</p>
        </div>
      )}
    </div>
  )
}

// ==================== REPAYMENTS LIST ====================
function RepaymentsList() {
  const [repayments, setRepayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/repayments').then(r => r.json()).then(d => { setRepayments(d.repayments || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">কিস্তি পরিশোধ</h2>
        <p className="text-gray-500 text-sm mt-1">আপনার সকল কিস্তির তালিকা</p>
      </div>
      {repayments.length > 0 ? (
        <div className="space-y-3">
          {repayments.map((r: any) => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">কিস্তি নং {r.installmentNumber}</p>
                    <p className="text-sm text-gray-500">নির্ধারিত: {formatDate(r.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <span className="font-semibold text-emerald-700">{formatTaka(r.amount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>কোনো কিস্তি পাওয়া যায়নি।</p>
        </div>
      )}
    </div>
  )
}

// ==================== NOTIFICATIONS ====================
function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/notifications').then(r => r.json()).then(d => { setNotifications(d.notifications || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markRead = async (id: string) => {
    await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: id }) })
    load()
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">নোটিফিকেশন</h2>
        <p className="text-gray-500 text-sm mt-1">আপনার সকল বার্তা</p>
      </div>
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Card key={n.id} className={`border-0 shadow-sm cursor-pointer transition-colors ${!n.isRead ? 'bg-emerald-50/50' : ''}`} onClick={() => !n.isRead && markRead(n.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>কোনো নোটিফিকেশন নেই।</p>
        </div>
      )}
    </div>
  )
}

// ==================== PROFILE PAGE ====================
function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => { setProfile(d.user); setForm({ name: d.user.name, email: d.user.email || '' }); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email || null })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('পরিবর্তন সংরক্ষণ করা হয়েছে।')
      setEditing(false)
      setProfile(prev => ({ ...prev, name: form.name, email: form.email || null }))
    } catch { toast.error('দুঃখিত, একটি সমস্যা হয়েছে।') }
    finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (passForm.newPass !== passForm.confirm) { toast.error('পাসওয়ার্ড দুইবার একই হতে হবে।'); return }
    if (passForm.newPass.length < 6) { toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.newPass })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে।')
      setPassForm({ current: '', newPass: '', confirm: '' })
    } catch { toast.error('দুঃখিত, একটি সমস্যা হয়েছে।') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">প্রোফাইল</h2>
        <p className="text-gray-500 text-sm mt-1">আপনার একাউন্টের তথ্য</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ব্যক্তিগত তথ্য</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'বাতিল করুন' : 'সম্পাদনা'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label>নাম</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>ইমেইল</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveProfile} disabled={saving}>
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
              </Button>
            </>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">নাম</p><p className="font-medium">{profile?.name}</p></div>
              <div><p className="text-sm text-gray-500">মোবাইল</p><p className="font-medium">{profile?.mobile}</p></div>
              <div><p className="text-sm text-gray-500">ইমেইল</p><p className="font-medium">{profile?.email || 'দেওয়া হয়নি'}</p></div>
              <div><p className="text-sm text-gray-500">ভূমিকা</p><p className="font-medium">{profile?.role === 'ADMIN' ? 'প্রশাসক' : 'ব্যবহারকারী'}</p></div>
              <div><p className="text-sm text-gray-500">নিবন্ধনের তারিখ</p><p className="font-medium">{profile?.createdAt ? formatDate(profile.createdAt) : ''}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>পাসওয়ার্ড পরিবর্তন</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>বর্তমান পাসওয়ার্ড</Label>
            <Input type="password" value={passForm.current} onChange={e => setPassForm(p => ({ ...p, current: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>নতুন পাসওয়ার্ড</Label>
            <Input type="password" value={passForm.newPass} onChange={e => setPassForm(p => ({ ...p, newPass: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>নতুন পাসওয়ার্ড নিশ্চিত করুন</Label>
            <Input type="password" value={passForm.confirm} onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={changePassword} disabled={saving}>
            {saving ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== USER DASHBOARD ====================
function UserDashboard() {
  const { state, setState } = useApp()

  const tabs = [
    { id: 'overview', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'new-application', label: 'আবেদন করুন', icon: <Plus className="h-4 w-4" /> },
    { id: 'applications', label: 'আবেদনসমূহ', icon: <FileText className="h-4 w-4" /> },
    { id: 'transactions', label: 'লেনদেন', icon: <ArrowRightLeft className="h-4 w-4" /> },
    { id: 'repayments', label: 'কিস্তি পরিশোধ', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'notifications', label: 'নোটিফিকেশন', icon: <Bell className="h-4 w-4" /> },
    { id: 'profile', label: 'প্রোফাইল', icon: <User className="h-4 w-4" /> }
  ]

  const renderTab = () => {
    switch (state.dashTab) {
      case 'overview': return <DashboardOverview />
      case 'new-application': return <NewApplication />
      case 'applications': return <ApplicationsList />
      case 'transactions': return <TransactionsList />
      case 'repayments': return <RepaymentsList />
      case 'notifications': return <NotificationsPage />
      case 'profile': return <ProfilePage />
      default: return <DashboardOverview />
    }
  }

  return (
    <DashboardShell
      activeTab={state.dashTab}
      onTabChange={(tab) => setState(s => ({ ...s, dashTab: tab }))}
      tabs={tabs}
      title="ড্যাশবোর্ড"
    >
      {renderTab()}
    </DashboardShell>
  )
}

// ==================== ADMIN PANEL ====================
function AdminPanel() {
  const { state, setState } = useApp()

  const tabs = [
    { id: 'admin-overview', label: 'ড্যাশবোর্ড', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'admin-users', label: 'ব্যবহারকারী', icon: <Users className="h-4 w-4" /> },
    { id: 'admin-applications', label: 'আবেদনসমূহ', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'admin-plans', label: 'কিস্তির পরিকল্পনা', icon: <Package className="h-4 w-4" /> },
    { id: 'admin-transactions', label: 'লেনদেন', icon: <ArrowRightLeft className="h-4 w-4" /> },
    { id: 'admin-repayments', label: 'কিস্তি', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'admin-notifications', label: 'নোটিফিকেশন', icon: <Megaphone className="h-4 w-4" /> },
    { id: 'admin-support', label: 'সহায়তা', icon: <LifeBuoy className="h-4 w-4" /> }
  ]

  const renderTab = () => {
    switch (state.adminTab) {
      case 'admin-overview': return <AdminOverview />
      case 'admin-users': return <AdminUsers />
      case 'admin-applications': return <AdminApplications />
      case 'admin-plans': return <AdminPlans />
      case 'admin-transactions': return <AdminTransactions />
      case 'admin-repayments': return <AdminRepayments />
      case 'admin-notifications': return <AdminNotifications />
      case 'admin-support': return <AdminSupport />
      default: return <AdminOverview />
    }
  }

  return (
    <DashboardShell
      activeTab={state.adminTab}
      onTabChange={(tab) => setState(s => ({ ...s, adminTab: tab }))}
      tabs={tabs}
      title="প্রশাসন প্যানেল"
    >
      {renderTab()}
    </DashboardShell>
  )
}

// ==================== ADMIN COMPONENTS ====================
function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, applications: 0, transactions: 0, pendingApps: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/applications').then(r => r.json())
    ]).then(([users, apps]) => {
      setStats({
        users: users.users?.length || 0,
        applications: apps.applications?.length || 0,
        transactions: 0,
        pendingApps: apps.applications?.filter((a: any) => a.status === 'PENDING').length || 0
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>

  const cards = [
    { label: 'মোট ব্যবহারকারী', value: stats.users, icon: <Users className="h-5 w-5" />, color: 'bg-blue-100 text-blue-600' },
    { label: 'মোট আবেদন', value: stats.applications, icon: <FileText className="h-5 w-5" />, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'মুলতবি আবেদন', value: stats.pendingApps, icon: <Clock className="h-5 w-5" />, color: 'bg-amber-100 text-amber-600' },
    { label: 'মোট লেনদেন', value: stats.transactions, icon: <ArrowRightLeft className="h-5 w-5" />, color: 'bg-purple-100 text-purple-600' }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">প্রশাসন ড্যাশবোর্ড</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ব্যবহারকারী</h2>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-600">নাম</th>
                <th className="text-left p-3 font-medium text-gray-600">মোবাইল</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden sm:table-cell">ইমেইল</th>
                <th className="text-left p-3 font-medium text-gray-600">ভূমিকা</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden md:table-cell">তারিখ</th>
              </tr></thead>
              <tbody className="divide-y">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">{u.mobile}</td>
                    <td className="p-3 hidden sm:table-cell text-gray-500">{u.email || '-'}</td>
                    <td className="p-3"><Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role === 'ADMIN' ? 'প্রশাসক' : 'ব্যবহারকারী'}</Badge></td>
                    <td className="p-3 hidden md:table-cell text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="text-center py-8 text-gray-400">কোনো ব্যবহারকারী নেই।</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminApplications() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/admin/applications').then(r => r.json()).then(d => { setApps(d.applications || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, status, rejectionReason: reason })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('আবেদনের অবস্থা আপডেট হয়েছে।')
      load()
    } catch { toast.error('দুঃখিত, একটি সমস্যা হয়েছে।') }
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">আবেদনসমূহ</h2>
      <div className="space-y-3">
        {apps.map((app: any) => (
          <Card key={app.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{app.user?.name}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-gray-500">মোবাইল: {app.user?.mobile} | তারিখ: {formatDate(app.createdAt)}</p>
                  {app.nidNumber && <p className="text-sm text-gray-500">NID: {app.nidNumber}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">{formatTaka(app.amount)}</p>
                    <p className="text-xs text-gray-500">মোট: {formatTaka(app.totalRepayable)}</p>
                  </div>
                  <div className="flex gap-1">
                    {app.status === 'PENDING' && (
                      <Button size="sm" variant="outline" className="text-blue-600" onClick={() => updateStatus(app.id, 'VERIFYING')}>
                        যাচাই শুরু
                      </Button>
                    )}
                    {app.status === 'VERIFYING' && (
                      <>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(app.id, 'APPROVED')}>
                          অনুমোদন
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => {
                          const reason = prompt('প্রত্যাখ্যানের কারণ লিখুন:')
                          if (reason) updateStatus(app.id, 'REJECTED', reason)
                        }}>
                          প্রত্যাখ্যান
                        </Button>
                      </>
                    )}
                    {app.status === 'APPROVED' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'COMPLETED')}>সম্পন্ন</Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {apps.length === 0 && <p className="text-center py-8 text-gray-400">কোনো আবেদন নেই।</p>}
      </div>
    </div>
  )
}

function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', interest: '', totalRepayable: '', installmentCount: '' })

  const load = () => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => { setPlans(d.plans || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const createPlan = async () => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          amount: parseFloat(form.amount),
          interest: parseFloat(form.interest) || 0,
          totalRepayable: parseFloat(form.totalRepayable),
          installmentCount: parseInt(form.installmentCount)
        })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('পরিকল্পনা তৈরি হয়েছে।')
      setShowForm(false)
      setForm({ name: '', amount: '', interest: '', totalRepayable: '', installmentCount: '' })
      load()
    } catch { toast.error('দুঃখিত, একটি সমস্যা হয়েছে।') }
  }

  const togglePlan = async (id: string) => {
    await fetch('/api/admin/plans', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: id }) })
    load()
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">কিস্তির পরিকল্পনা</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> নতুন পরিকল্পনা
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>নাম</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="পরিকল্পনার নাম" /></div>
              <div className="space-y-1"><Label>ঋণের পরিমাণ</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="5650" /></div>
              <div className="space-y-1"><Label>সুদ</Label><Input type="number" value={form.interest} onChange={e => setForm(p => ({ ...p, interest: e.target.value }))} placeholder="500" /></div>
              <div className="space-y-1"><Label>মোট পরিশোধযোগ্য</Label><Input type="number" value={form.totalRepayable} onChange={e => setForm(p => ({ ...p, totalRepayable: e.target.value }))} placeholder="6150" /></div>
              <div className="space-y-1"><Label>কিস্তি সংখ্যা</Label><Input type="number" value={form.installmentCount} onChange={e => setForm(p => ({ ...p, installmentCount: e.target.value }))} placeholder="3" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createPlan} className="bg-emerald-600 hover:bg-emerald-700">সংরক্ষণ করুন</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>বাতিল করুন</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {plans.map((plan: any) => (
          <Card key={plan.id} className={`border-0 shadow-sm ${!plan.isActive ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-gray-500">
                  {formatTaka(plan.amount)} | সুদ: {formatTaka(plan.interest)} | মোট: {formatTaka(plan.totalRepayable)} | {plan.installmentCount} কিস্তি
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => togglePlan(plan.id)}>
                {plan.isActive ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/transactions').then(r => r.json()).then(d => { setTransactions(d.transactions || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">লেনদেন</h2>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-600">ব্যবহারকারী</th>
                <th className="text-left p-3 font-medium text-gray-600">ধরন</th>
                <th className="text-left p-3 font-medium text-gray-600">পরিমাণ</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden sm:table-cell">বিবরণ</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden md:table-cell">তারিখ</th>
              </tr></thead>
              <tbody className="divide-y">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{tx.user?.name}<br /><span className="text-xs text-gray-400">{tx.user?.mobile}</span></td>
                    <td className="p-3"><Badge variant="secondary">{tx.type}</Badge></td>
                    <td className="p-3 font-medium">{formatTaka(tx.amount)}</td>
                    <td className="p-3 hidden sm:table-cell text-gray-500 text-xs">{tx.description || '-'}</td>
                    <td className="p-3 hidden md:table-cell text-gray-500 text-xs">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && <p className="text-center py-8 text-gray-400">কোনো লেনদেন নেই।</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminRepayments() {
  const [repayments, setRepayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/repayments').then(r => r.json()).then(d => { setRepayments(d.repayments || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">কিস্তি</h2>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-600">ব্যবহারকারী</th>
                <th className="text-left p-3 font-medium text-gray-600">কিস্তি</th>
                <th className="text-left p-3 font-medium text-gray-600">পরিমাণ</th>
                <th className="text-left p-3 font-medium text-gray-600">নির্ধারিত</th>
                <th className="text-left p-3 font-medium text-gray-600">অবস্থা</th>
              </tr></thead>
              <tbody className="divide-y">
                {repayments.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.user?.name}</td>
                    <td className="p-3">নং {r.installmentNumber}</td>
                    <td className="p-3 font-medium">{formatTaka(r.amount)}</td>
                    <td className="p-3 text-gray-500 text-xs">{formatDate(r.dueDate)}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {repayments.length === 0 && <p className="text-center py-8 text-gray-400">কোনো কিস্তি নেই।</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminNotifications() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ userId: '', title: '', message: '' })

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const send = async () => {
    if (!form.userId || !form.title || !form.message) { toast.error('সব তথ্য দিন।'); return }
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('নোটিফিকেশন পাঠানো হয়েছে।')
      setForm({ userId: '', title: '', message: '' })
    } catch { toast.error('দুঃখিত, একটি সমস্যা হয়েছে।') }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">নোটিফিকেশন পাঠান</h2>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {loading ? <Skeleton className="h-10" /> : (
            <div className="space-y-2">
              <Label>ব্যবহারকারী</Label>
              <select className="w-full rounded-md border p-2 text-sm" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}>
                <option value="">ব্যবহারকারী বেছে নিন</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} - {u.mobile}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-2"><Label>শিরোনাম</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="শিরোনাম" /></div>
          <div className="space-y-2"><Label>বার্তা</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="বার্তা লিখুন" /></div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={send}><Send className="h-4 w-4 mr-1" /> পাঠান</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/admin/support').then(r => r.json()).then(d => { setTickets(d.tickets || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/support', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: id, status }) })
    load()
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">সহায়তা</h2>
      {tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((t: any) => (
            <Card key={t.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <p className="text-sm text-gray-500">{t.user?.name} - {t.user?.mobile}</p>
                    <p className="text-sm text-gray-400 mt-1">{t.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    <select className="text-xs border rounded p-1" value={t.status} onChange={e => updateStatus(t.id, e.target.value)}>
                      <option value="OPEN">খোলা</option>
                      <option value="IN_PROGRESS">প্রক্রিয়াধীন</option>
                      <option value="RESOLVED">সমাধান হয়েছে</option>
                      <option value="CLOSED">বন্ধ</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <LifeBuoy className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>কোনো টিকেট নেই।</p>
        </div>
      )}
    </div>
  )
}

// ==================== MAIN APP ====================
export default function KistiApp() {
  const [state, setState] = useState<AppState>({
    user: null,
    loading: true,
    view: 'landing',
    dashTab: 'overview',
    adminTab: 'admin-overview',
    mobileMenuOpen: false
  })

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated) {
          setState(prev => ({
            ...prev,
            user: data.user,
            loading: false,
            view: data.user.role === 'ADMIN' ? 'admin' : 'dashboard'
          }))
          return
        }
      }
      setState(prev => ({ ...prev, user: null, loading: false }))
    } catch {
      setState(prev => ({ ...prev, user: null, loading: false }))
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setState(prev => ({
              ...prev,
              user: data.user,
              loading: false,
              view: data.user.role === 'ADMIN' ? 'admin' : 'dashboard'
            }))
            return
          }
        }
        setState(prev => ({ ...prev, user: null, loading: false }))
      } catch {
        if (mounted) setState(prev => ({ ...prev, user: null, loading: false }))
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    setState(prev => ({ ...prev, user: null, view: 'landing', dashTab: 'overview', adminTab: 'admin-overview' }))
  }, [])

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-500">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, setState, handleLogout, refreshSession }}>
      <Toaster position="top-center" richColors />
      {state.view === 'landing' && <LandingPage />}
      {state.view === 'login' && <LoginPage />}
      {state.view === 'register' && <RegisterPage />}
      {state.view === 'dashboard' && <UserDashboard />}
      {state.view === 'admin' && <AdminPanel />}
    </AppContext.Provider>
  )
}