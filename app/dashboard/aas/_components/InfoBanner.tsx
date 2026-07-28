'use client'

// Beda dari LPDP Center: AAS Indonesia tidak punya satu tanggal batch yang pasti untuk countdown
// (form sumber Intake 2027 sudah tutup 30 April 2026, siklus berikutnya belum terkonfirmasi resmi
// di proyek ini) — jadi banner ini statis, bukan countdown, dan mengarahkan cek jadwal terbaru.
export default function InfoBanner() {
  return (
    <div className="bg-navy text-white text-center text-xs sm:text-sm font-medium py-2.5 px-4 rounded-xl mb-4">
      📅 Pendaftaran AAS Indonesia biasanya dibuka Februari–April tiap tahun — cek jadwal & form resmi
      terbaru di <span className="font-semibold">australiaawardsindonesia.org</span> sebelum submit.
    </div>
  )
}
