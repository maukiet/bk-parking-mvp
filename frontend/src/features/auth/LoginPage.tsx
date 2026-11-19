import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { PortalTarget } from '../../types/api'
import { login, saveSession } from './authApi'

const parkingSpaces = [true, false, true, true, false, true, false, true, true, false, true, true, false, true, false, true, true, false]

export type LoginDestinations = Partial<Record<PortalTarget, string>>

function destination(next: string | null, home: string) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return home
  const target = new URL(next, window.location.origin)
  const portal = home.split('/')[1]
  if (target.origin !== window.location.origin || target.pathname === '/admin/login') return home
  return target.pathname === `/${portal}` || target.pathname.startsWith(`/${portal}/`)
    ? target.pathname + target.search + target.hash
    : home
}

export function LoginPage({ destinations, publicPath }: { destinations: LoginDestinations; publicPath?: string }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      const result = await login({
        username: String(data.get('username') ?? '').trim(),
        password: String(data.get('password') ?? ''),
      })
      const home = destinations[result.portalTarget]
      if (!home) throw new Error('Cổng dành cho tài khoản này chưa được tích hợp trong phiên bản hiện tại.')

      saveSession(result)
      navigate(destination(params.get('next'), home), { replace: true })
    } catch (error) {
      setError(error instanceof TypeError
        ? 'Không kết nối được với máy chủ. Vui lòng thử lại.'
        : error instanceof Error ? error.message : 'Không đăng nhập được. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  const field = 'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 focus-visible:outline-2 focus-visible:outline-lime-600 disabled:opacity-60'

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-950">
      <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-5 lg:px-8">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-black font-black text-lime-400">P</span>
        <span className="font-bold">BK Parking</span>
      </header>
      <main className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[58fr_42fr]">
        <section className="flex flex-col justify-between bg-black px-6 py-8 text-white sm:px-10 lg:p-14">
          <div>
            <p className="flex items-center gap-3 text-sm text-slate-200">
              <span className="grid size-10 place-items-center rounded-xl border border-dashed border-lime-400 font-bold text-lime-400">BK</span>
              Trường Đại học Bách khoa TP.HCM – Cơ sở 1
            </p>
            <p className="mt-4 max-w-xl text-3xl font-bold tracking-tight lg:text-4xl">Hệ thống quản lý bãi đỗ xe thông minh</p>
          </div>

          <div className="hidden py-10 lg:block" aria-hidden="true">
            <div className="grid grid-cols-9 gap-2 rounded-3xl border border-slate-700 bg-zinc-900 p-4">
              {parkingSpaces.map((occupied, index) => (
                <div key={index} className={`grid aspect-[2/3] place-items-center rounded-lg border p-1 ${occupied ? 'border-slate-500' : 'border-lime-400 bg-lime-400/15'}`}>
                  {occupied ? (
                    <div className={`flex h-4/5 w-3/4 items-end justify-center rounded-md pb-1 ${index % 3 === 0 ? 'bg-white' : 'bg-lime-400'}`}>
                      <span className="h-1/4 w-3/5 rounded bg-black/50" />
                    </div>
                  ) : <span className="text-sm font-bold text-lime-400">P</span>}
                </div>
              ))}
            </div>
            <ul className="mt-7 space-y-3 text-sm text-slate-200">
              {['Xem chỗ trống theo thời gian thực', 'Mã QR ra/vào nhanh', 'Đăng ký xe và theo dõi gói trực tuyến'].map(text => (
                <li key={text} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-lg bg-zinc-800 text-lime-400">✓</span>{text}</li>
              ))}
            </ul>
          </div>
          <p className="hidden text-xs text-slate-400 lg:block">© 2026 BK Parking · Phiên bản 1.0</p>
        </section>
        <section className="grid place-items-center p-5 sm:p-8" aria-labelledby="login-title">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
            <div>
              <h1 id="login-title" className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
              <p className="mt-1 text-sm text-slate-600">Sử dụng tài khoản được cấp cho hệ thống BK Parking.</p>
            </div>
            {params.get('expired') === '1' && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.</p>}
            {params.get('forbidden') === '1' && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Tài khoản hiện tại không có quyền quản trị. Hãy dùng tài khoản Admin để tiếp tục.</p>}
            <form onSubmit={signIn} className="space-y-4">
              <label className="block text-sm font-medium">Tên đăng nhập
                <input name="username" autoComplete="username" required disabled={pending} className={field} />
              </label>
              <label className="block text-sm font-medium">Mật khẩu
                <input name="password" type="password" autoComplete="current-password" required disabled={pending} className={field} />
              </label>
              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <button type="submit" disabled={pending} className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60">
                {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </button>
            </form>
            {publicPath && <Link to={publicPath} className="block border-t border-slate-100 pt-4 text-center text-sm font-semibold underline">Xem tình trạng chỗ trống</Link>}
            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <h2 className="font-bold">Ai dùng được hệ thống?</h2>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li>Sinh viên, giảng viên, nhân viên · Đăng ký xe, xem chỗ trống</li>
                <li>Bảo vệ · Kiểm soát lượt vào và ra tại cổng</li>
                <li>Ban quản lý · Quản trị và báo cáo</li>
              </ul>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}
