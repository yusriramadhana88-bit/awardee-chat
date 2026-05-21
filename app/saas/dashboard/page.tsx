'use client'

import { useState } from 'react'

type Tab = 'overview' | 'laporan' | 'pajak' | 'ai' | 'kepatuhan'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Dashboard', icon: '🏠' },
  { id: 'laporan', label: 'Laporan Keuangan', icon: '📊' },
  { id: 'pajak', label: 'Perpajakan', icon: '🧾' },
  { id: 'ai', label: 'Tanya JAI', icon: '🤖' },
  { id: 'kepatuhan', label: 'Kepatuhan', icon: '⚖️' },
]

const TRANSACTIONS = [
  { date: '18 Mei', desc: 'Penjualan produk kerajinan', type: 'Pendapatan', amount: '+Rp 2.450.000', color: 'text-green-600' },
  { date: '17 Mei', desc: 'Gaji karyawan BUMDes (2 orang)', type: 'Pengeluaran', amount: '-Rp 6.000.000', color: 'text-red-500' },
  { date: '15 Mei', desc: 'Pendapatan sewa kios pasar desa', type: 'Pendapatan', amount: '+Rp 3.200.000', color: 'text-green-600' },
  { date: '14 Mei', desc: 'Pembelian bahan baku', type: 'Pengeluaran', amount: '-Rp 1.800.000', color: 'text-red-500' },
  { date: '12 Mei', desc: 'Setoran modal dari Desa', type: 'Modal', amount: '+Rp 10.000.000', color: 'text-blue-600' },
]

const TAX_ITEMS = [
  { nama: 'SPT Masa PPh 21 — April 2026', deadline: '20 Mei 2026', status: 'Jatuh Tempo', statusColor: 'bg-red-100 text-red-700', jumlah: 'Rp 0 (nihil)' },
  { nama: 'SPT Masa PPh 23 — April 2026', deadline: '20 Mei 2026', status: 'Jatuh Tempo', statusColor: 'bg-red-100 text-red-700', jumlah: 'Rp 320.000' },
  { nama: 'SPT Masa PPh 21 — Mei 2026', deadline: '20 Jun 2026', status: 'Upcoming', statusColor: 'bg-yellow-100 text-yellow-700', jumlah: 'Perlu hitung' },
  { nama: 'SPT Tahunan PPh Badan 2025', deadline: '30 Apr 2027', status: 'Aman', statusColor: 'bg-green-100 text-green-700', jumlah: 'Estimasi Rp 1,2 juta' },
]

const COMPLIANCE_ITEMS = [
  { item: 'Badan Hukum BUMDes (AHU)', status: '✅ Selesai', detail: 'Terdaftar 12 Jan 2025', color: 'text-green-600' },
  { item: 'NPWP BUMDes', status: '✅ Selesai', detail: 'NPWP: 12.345.678.9-123.000', color: 'text-green-600' },
  { item: 'Rekening Bank BUMDes Terpisah', status: '✅ Selesai', detail: 'BRI No. 001-xxxx', color: 'text-green-600' },
  { item: 'AD/ART BUMDes', status: '✅ Selesai', detail: 'Ditetapkan dalam Perdes No. 3/2025', color: 'text-green-600' },
  { item: 'Laporan Keuangan Semester I 2025', status: '✅ Selesai', detail: 'Dilaporkan 5 Jul 2025', color: 'text-green-600' },
  { item: 'Laporan Keuangan Semester II 2025', status: '✅ Selesai', detail: 'Dilaporkan 8 Jan 2026', color: 'text-green-600' },
  { item: 'Laporan Keuangan Semester I 2026', status: '⏳ Belum', detail: 'Deadline: 31 Jul 2026', color: 'text-yellow-600' },
  { item: 'Izin Usaha Unit Warung', status: '⚠️ Perlu Update', detail: 'NIB perlu diperpanjang', color: 'text-orange-500' },
  { item: 'Izin Usaha Unit Wisata', status: '❌ Belum Ada', detail: 'Segera urus ke Dinas', color: 'text-red-500' },
]

const AI_MESSAGES = [
  { role: 'user', text: 'BUMDes kami punya 2 karyawan gaji Rp 3 juta/bulan. Berapa PPh 21 yang harus dipotong?' },
  { role: 'ai', text: 'Untuk karyawan dengan gaji Rp 3.000.000/bulan (Rp 36 juta/tahun):\n\n📌 PTKP TK/0 = Rp 54.000.000/tahun\n📌 Penghasilan Neto = Rp 36.000.000\n📌 PKP = Rp 36 juta - Rp 54 juta = **minus → Rp 0**\n\n✅ **PPh 21 = Rp 0 (nihil)** karena penghasilan di bawah PTKP.\n\nNamun Anda tetap wajib:\n1. Membuat bukti potong Form 1721-A2 di akhir tahun\n2. Melaporkan SPT Masa PPh 21 setiap bulan (nihil)\n\nMau saya bantu buat bukti potong otomatis? 📄' },
  { role: 'user', text: 'Kalau kita sewa kios ke warga desa, kena pajak apa?' },
  { role: 'ai', text: 'Untuk sewa kios dari warga desa ke BUMDes:\n\n📌 **PPh Pasal 4 Ayat (2)** — Pajak Final atas sewa tanah/bangunan\n📌 Tarif: **10% dari nilai sewa** (final, dipotong BUMDes)\n📌 BUMDes wajib memotong, menyetor, dan melaporkan ke DJP\n\nContoh: Sewa kios Rp 500.000/bulan → BUMDes potong PPh Rp 50.000 → Pemilik terima Rp 450.000\n\n⚠️ Deadline setor: tanggal 10 bulan berikutnya\n⚠️ Deadline lapor SPT Masa: tanggal 20 bulan berikutnya\n\nSudah saya catat di kalender pajak Anda. Mau langsung buat kode billing-nya? 💳' },
]

function BarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]))
  return (
    <div className="flex items-end gap-3 h-32 px-2">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '100px' }}>
            <div className="w-4 bg-green-400 rounded-t" style={{ height: `${(d.income / max) * 100}%` }} title={`Pendapatan Rp ${d.income.toLocaleString()}`}></div>
            <div className="w-4 bg-red-300 rounded-t" style={{ height: `${(d.expense / max) * 100}%` }} title={`Pengeluaran Rp ${d.expense.toLocaleString()}`}></div>
          </div>
          <span className="text-xs text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [aiInput, setAiInput] = useState('')
  const [messages, setMessages] = useState(AI_MESSAGES)

  const handleAiSend = () => {
    if (!aiInput.trim()) return
    setMessages([...messages, { role: 'user', text: aiInput }, { role: 'ai', text: '⏳ Sedang menganalisis regulasi terbaru... (Demo mode: jawaban AI akan muncul di versi penuh)' }])
    setAiInput('')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <div className="bg-green-800 text-white px-4 py-2 text-xs text-center">
        🎯 <strong>Mode Demo</strong> — Ini adalah prototipe PatuhDesa. Data ditampilkan adalah contoh.
        <a href="/saas" className="ml-3 underline hover:text-yellow-300">← Kembali ke Landing Page</a>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-green-900 text-white flex flex-col shrink-0 hidden md:flex">
          <div className="px-5 py-5 border-b border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center font-black text-xs">PD</div>
              <span className="font-bold text-sm">PatuhDesa</span>
            </div>
            <div className="text-green-300 text-xs">BUMDes Maju Bersama</div>
            <div className="text-green-400 text-xs">Desa Sukajadi, Klaten</div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                  activeTab === tab.id ? 'bg-green-600 text-white font-semibold' : 'text-green-200 hover:bg-green-800'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-green-800">
            <div className="bg-green-800 rounded-xl p-3">
              <div className="text-xs text-green-300 mb-1">Paket Aktif</div>
              <div className="text-sm font-bold text-white">Pro Plan</div>
              <div className="text-xs text-green-400">Rp 199K/bulan</div>
            </div>
          </div>
        </aside>

        {/* Mobile Tab Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs ${activeTab === tab.id ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>
              <span>{tab.icon}</span>
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Selamat datang, Pak Suyitno 👋</h1>
                <p className="text-gray-500 text-sm">Selasa, 19 Mei 2026 · BUMDes Maju Bersama</p>
              </div>

              {/* Alert */}
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div>
                  <div className="text-sm font-semibold text-red-700">2 Kewajiban Pajak Jatuh Tempo Hari Ini!</div>
                  <div className="text-xs text-red-600">SPT Masa PPh 21 & PPh 23 April 2026 — deadline 20 Mei 2026</div>
                </div>
                <button onClick={() => setActiveTab('pajak')} className="ml-auto bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700">Lihat Pajak</button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Kas & Bank', val: 'Rp 42.650.000', sub: '+Rp 5.850.000 bulan ini', color: 'text-green-600', icon: '💰' },
                  { label: 'Pendapatan Mei', val: 'Rp 18.200.000', sub: '↑ 12% vs April', color: 'text-blue-600', icon: '📈' },
                  { label: 'Pengeluaran Mei', val: 'Rp 12.350.000', sub: '↓ 3% vs April', color: 'text-red-500', icon: '📉' },
                  { label: 'Laba Bersih Mei', val: 'Rp 5.850.000', sub: '↑ dari Rp 4.200.000', color: 'text-purple-600', icon: '✨' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-200">
                    <div className="text-xl mb-2">{s.icon}</div>
                    <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                    <div className={`text-base font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-sm">Arus Kas 6 Bulan</h3>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block"></span>Pendapatan</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-300 rounded inline-block"></span>Pengeluaran</span>
                    </div>
                  </div>
                  <BarChart data={[
                    { label: 'Des', income: 9500000, expense: 7200000 },
                    { label: 'Jan', income: 11200000, expense: 9800000 },
                    { label: 'Feb', income: 13400000, expense: 10100000 },
                    { label: 'Mar', income: 15800000, expense: 11500000 },
                    { label: 'Apr', income: 16200000, expense: 12700000 },
                    { label: 'Mei', income: 18200000, expense: 12350000 },
                  ]} />
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-sm">Transaksi Terakhir</h3>
                    <button onClick={() => setActiveTab('laporan')} className="text-xs text-green-600 hover:text-green-700">Lihat semua →</button>
                  </div>
                  <div className="space-y-3">
                    {TRANSACTIONS.map((t, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="text-xs text-gray-400 w-12 shrink-0">{t.date}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 truncate">{t.desc}</div>
                          <div className="text-xs text-gray-400">{t.type}</div>
                        </div>
                        <div className={`text-sm font-semibold shrink-0 ${t.color}`}>{t.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LAPORAN TAB */}
          {activeTab === 'laporan' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Laporan Keuangan</h1>
                  <p className="text-gray-500 text-sm">Periode: Januari — Mei 2026</p>
                </div>
                <div className="flex gap-2">
                  <button className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Filter Periode</button>
                  <button className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">Export PDF</button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Laba Rugi */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-green-700 text-white px-5 py-3 font-bold text-sm">📊 Laporan Laba Rugi — Mei 2026</div>
                  <div className="p-5">
                    <div className="space-y-2 text-sm mb-4">
                      <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">PENDAPATAN</div>
                      {[['Penjualan Produk Kerajinan', 'Rp 8.450.000'], ['Pendapatan Sewa Kios', 'Rp 6.400.000'], ['Jasa Penggilingan Padi', 'Rp 3.350.000']].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="font-medium">{v}</span></div>
                      ))}
                      <div className="flex justify-between font-bold border-t pt-2"><span>Total Pendapatan</span><span className="text-green-600">Rp 18.200.000</span></div>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">BEBAN</div>
                      {[['Gaji Karyawan', 'Rp 6.000.000'], ['Bahan Baku', 'Rp 3.200.000'], ['Operasional & Listrik', 'Rp 1.500.000'], ['Penyusutan Aset', 'Rp 1.050.000'], ['Pajak (PPh 23)', 'Rp 400.000']].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="font-medium text-red-500">({v})</span></div>
                      ))}
                      <div className="flex justify-between font-bold border-t pt-2"><span>Total Beban</span><span className="text-red-500">Rp 12.150.000</span></div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Laba Bersih</span>
                      <span className="font-black text-green-600 text-lg">Rp 6.050.000</span>
                    </div>
                  </div>
                </div>

                {/* Neraca */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-blue-700 text-white px-5 py-3 font-bold text-sm">📋 Laporan Posisi Keuangan — 31 Mei 2026</div>
                  <div className="p-5">
                    <div className="space-y-2 text-sm mb-4">
                      <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">ASET</div>
                      {[['Kas & Bank', 'Rp 42.650.000'], ['Piutang Usaha', 'Rp 3.200.000'], ['Persediaan', 'Rp 8.500.000'], ['Aset Tetap (net)', 'Rp 45.000.000']].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="font-medium">{v}</span></div>
                      ))}
                      <div className="flex justify-between font-bold border-t pt-2"><span>Total Aset</span><span className="text-blue-600">Rp 99.350.000</span></div>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">KEWAJIBAN & EKUITAS</div>
                      {[['Utang Usaha', 'Rp 4.500.000'], ['Modal Desa', 'Rp 68.750.000'], ['Laba Ditahan', 'Rp 20.050.000'], ['Laba Berjalan', 'Rp 6.050.000']].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-gray-600">{k}</span><span className="font-medium">{v}</span></div>
                      ))}
                      <div className="flex justify-between font-bold border-t pt-2"><span>Total K + Ekuitas</span><span className="text-blue-600">Rp 99.350.000</span></div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
                      <span>✅</span> Laporan sudah sesuai Kepmendesa 136/2022
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-4">Semua Transaksi — Mei 2026</h3>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-400 border-b"><th className="pb-2">Tanggal</th><th className="pb-2">Deskripsi</th><th className="pb-2">Kategori</th><th className="pb-2 text-right">Jumlah</th></tr></thead>
                  <tbody>
                    {TRANSACTIONS.map((t, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-3 text-gray-400 text-xs">{t.date}</td>
                        <td className="py-3 text-gray-700">{t.desc}</td>
                        <td className="py-3"><span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t.type}</span></td>
                        <td className={`py-3 text-right font-semibold ${t.color}`}>{t.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAJAK TAB */}
          {activeTab === 'pajak' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Perpajakan BUMDes</h1>
                <p className="text-gray-500 text-sm">Kalender, kalkulator & panduan kepatuhan pajak</p>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <div className="font-bold text-red-700">2 Kewajiban Jatuh Tempo Hari Ini — 20 Mei 2026</div>
                    <div className="text-sm text-red-600">Denda keterlambatan: Rp 100.000/SPT</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-red-200">
                    <div className="font-semibold text-sm text-gray-800 mb-1">SPT Masa PPh 21 — April 2026</div>
                    <div className="text-xs text-gray-500 mb-3">Pajak penghasilan karyawan (nihil)</div>
                    <button className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700">Lapor Sekarang →</button>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-red-200">
                    <div className="font-semibold text-sm text-gray-800 mb-1">SPT Masa PPh 23 — April 2026</div>
                    <div className="text-xs text-gray-500 mb-3">Pajak atas sewa kios — Rp 320.000</div>
                    <button className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700">Bayar & Lapor →</button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Kalkulator PPh 21 */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-800 mb-4">🧮 Kalkulator PPh 21 Karyawan</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Nama Karyawan</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" defaultValue="Budi Santoso" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Gaji Pokok/Bulan</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" defaultValue="Rp 3.000.000" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Status PTKP</label>
                      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option>TK/0 — Lajang, tidak ada tanggungan</option>
                        <option>K/0 — Kawin, tidak ada tanggungan</option>
                        <option>K/1 — Kawin, 1 tanggungan</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 mt-4">
                    <div className="text-xs text-gray-500 mb-2">Hasil Perhitungan</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-400">Penghasilan Neto/Tahun</span><div className="font-semibold">Rp 36.000.000</div></div>
                      <div><span className="text-gray-400">PTKP (TK/0)</span><div className="font-semibold">Rp 54.000.000</div></div>
                      <div><span className="text-gray-400">PKP</span><div className="font-semibold text-green-600">Rp 0 (di bawah PTKP)</div></div>
                      <div><span className="text-gray-400">PPh 21/Bulan</span><div className="font-bold text-green-600">Rp 0 (Nihil)</div></div>
                    </div>
                  </div>
                </div>

                {/* Tax Calendar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-800 mb-4">📅 Kalender Kewajiban Pajak</h3>
                  <div className="space-y-3">
                    {TAX_ITEMS.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{t.nama}</div>
                          <div className="text-xs text-gray-400">{t.deadline} · {t.jumlah}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${t.statusColor}`}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>
              <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900">🤖 Tanya JAI</h1>
                <p className="text-gray-500 text-sm">AI konsultan pajak & hukum BUMDes — berbasis regulasi terbaru</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 flex flex-col flex-1 overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b flex items-center gap-3 text-sm">
                  <span className="text-green-500 text-lg">🤖</span>
                  <div>
                    <div className="font-semibold text-gray-800">JAI AI Assistant</div>
                    <div className="text-xs text-gray-400">Dilatih dari Permendesa, PMK, PP BUMDes, panduan BPKP · Update: Mei 2026</div>
                  </div>
                  <span className="ml-auto text-xs text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Online</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 text-center">
                    Tanya apa saja tentang keuangan, pajak, dan hukum BUMDes. Jawaban berdasarkan regulasi resmi.
                  </div>
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.role === 'ai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {m.role === 'ai' ? 'AI' : 'U'}
                      </div>
                      <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${m.role === 'ai' ? 'bg-gray-50 text-gray-700 border border-gray-100' : 'bg-green-600 text-white'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t flex gap-2">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
                    placeholder="Tanya tentang pajak, akuntansi, atau hukum BUMDes..."
                  />
                  <button onClick={handleAiSend} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">Kirim</button>
                </div>
              </div>
            </div>
          )}

          {/* KEPATUHAN TAB */}
          {activeTab === 'kepatuhan' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Kepatuhan Hukum & Regulasi</h1>
                <p className="text-gray-500 text-sm">Status seluruh kewajiban hukum BUMDes Maju Bersama</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Terpenuhi', val: '6', color: 'bg-green-50 border-green-200', textColor: 'text-green-600', icon: '✅' },
                  { label: 'Perlu Perhatian', val: '2', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-600', icon: '⏳' },
                  { label: 'Belum Terpenuhi', val: '1', color: 'bg-red-50 border-red-200', textColor: 'text-red-600', icon: '❌' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl border-2 p-5 text-center ${s.color}`}>
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className={`text-3xl font-black ${s.textColor}`}>{s.val}</div>
                    <div className="text-sm text-gray-600 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b bg-gray-50">
                  <h3 className="font-bold text-gray-800">Checklist Kepatuhan BUMDes</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {COMPLIANCE_ITEMS.map((c, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{c.item}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{c.detail}</div>
                      </div>
                      <div className={`text-sm font-semibold shrink-0 ${c.color}`}>{c.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="font-bold text-blue-800 mb-3">💡 Rekomendasi dari JAI</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex gap-2"><span className="text-orange-500 shrink-0">1.</span> Izin usaha unit warung perlu diperpanjang NIB-nya. Hubungi OSS (oss.go.id) atau minta bantuan tim JAI.</div>
                  <div className="flex gap-2"><span className="text-red-500 shrink-0">2.</span> Unit wisata belum memiliki izin usaha. Segera urus ke Dinas Pariwisata Kabupaten — berisiko kena sanksi.</div>
                  <div className="flex gap-2"><span className="text-blue-500 shrink-0">3.</span> Laporan keuangan Semester I 2026 perlu disiapkan mulai bulan depan (deadline 31 Juli 2026).</div>
                </div>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Tanya JAI untuk Panduan Lengkap →
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
