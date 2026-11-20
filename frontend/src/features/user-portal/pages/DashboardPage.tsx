import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { ApiError, apiGet, apiPut } from '../../../shared/api/apiClient'
import { useAuth } from '../../../shared/auth/AuthContext'
import { Icon } from '../../../shared/components/Icon'
import { PageHeader } from '../../../shared/components/PageHeader'
import type {
  ParkingLotDto,
  PublicParkingLotsResponse,
  UserVehicleDto,
  VehicleQrResponse,
} from '../../../types/api'

type DashboardTab = 'lots' | 'qr'

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

function formatTime(value: string | null) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getLotMarker(code: string) {
  return code.match(/([A-Z])\d*$/i)?.[1] ?? code.slice(-1)
}

export function DashboardPage() {
  const { user, isLoading: isAuthLoading, login } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: DashboardTab = searchParams.get('tab') === 'qr' ? 'qr' : 'lots'
  const isAdmin = user?.role === 'ROLE_ADMIN'

  const [lots, setLots] = useState<ParkingLotDto[]>([])
  const [isLotsLoading, setIsLotsLoading] = useState(true)
  const [lotsError, setLotsError] = useState('')
  const [search, setSearch] = useState('')
  const [draftCapacities, setDraftCapacities] = useState<Record<number, number>>({})
  const [savingLotId, setSavingLotId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')

  const [vehicles, setVehicles] = useState<UserVehicleDto[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [vehicleQr, setVehicleQr] = useState<VehicleQrResponse | null>(null)
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false)
  const [vehiclesError, setVehiclesError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    let cancelled = false
    setIsLotsLoading(true)
    setLotsError('')

    apiGet<PublicParkingLotsResponse>('/public/parking-lots')
      .then((response) => {
        if (!cancelled) setLots(response.parkingLots ?? [])
      })
      .catch((error: unknown) => {
        if (!cancelled) setLotsError(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setIsLotsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'qr' || !user) return

    let cancelled = false
    setVehiclesError('')
    setIsVehiclesLoading(true)
    setVehicles([])
    setSelectedVehicleId(null)
    setVehicleQr(null)

    apiGet<UserVehicleDto[]>('/vehicles/my')
      .then((result) => {
        if (cancelled) return
        const myVehicles = result ?? []
        setVehicles(myVehicles)
        const approvedVehicles = myVehicles.filter(
          (vehicle) => vehicle.status === 'APPROVED',
        )
        setSelectedVehicleId((currentId) =>
          approvedVehicles.some((vehicle) => vehicle.id === currentId)
            ? currentId
            : (approvedVehicles[0]?.id ?? null),
        )
      })
      .catch((error: unknown) => {
        if (!cancelled) setVehiclesError(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setIsVehiclesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, user?.id])

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === selectedVehicleId,
  )

  useEffect(() => {
    if (
      activeTab !== 'qr' ||
      !user ||
      !selectedVehicleId ||
      selectedVehicle?.status !== 'APPROVED'
    ) {
      setVehicleQr(null)
      return
    }

    let cancelled = false
    setVehiclesError('')
    setVehicleQr(null)
    setIsVehiclesLoading(true)

    apiGet<VehicleQrResponse>(`/vehicles/${selectedVehicleId}/qr`)
      .then((qr) => {
        if (!cancelled) setVehicleQr(qr)
      })
      .catch((error: unknown) => {
        if (!cancelled) setVehiclesError(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setIsVehiclesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, selectedVehicle?.status, selectedVehicleId, user?.id])

  const visibleLots = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN')
    if (!normalizedSearch) return lots
    return lots.filter((lot) =>
      `${lot.name} ${lot.code} ${lot.location}`
        .toLocaleLowerCase('vi-VN')
        .includes(normalizedSearch),
    )
  }, [lots, search])

  function selectTab(tab: DashboardTab) {
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'qr') nextParams.set('tab', 'qr')
    else nextParams.delete('tab')
    setSearchParams(nextParams, { replace: true })
  }

  async function saveCapacity(lot: ParkingLotDto) {
    const capacity = draftCapacities[lot.id] ?? lot.capacity
    if (!isAdmin || capacity === lot.capacity || capacity < lot.occupiedCount) return

    setSavingLotId(lot.id)
    setSaveError('')
    try {
      const updated = await apiPut<ParkingLotDto>(
        `/admin/parking-lots/${lot.id}`,
        { capacity },
      )
      setLots((currentLots) =>
        currentLots.map((current) =>
          current.id === lot.id ? updated : current,
        ),
      )
      setDraftCapacities((current) => {
        const next = { ...current }
        delete next[lot.id]
        return next
      })
    } catch (error) {
      setSaveError(getErrorMessage(error))
    } finally {
      setSavingLotId(null)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')
    try {
      await login(username, password)
      setPassword('')
    } catch (error) {
      setLoginError(
        error instanceof ApiError
          ? error.message
          : 'Không thể đăng nhập. Vui lòng thử lại.',
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <section aria-labelledby="page-title">
      <PageHeader
        title="Dashboard"
        description="Đăng ký và theo dõi xe của bạn"
      />

      <div className="mt-12 overflow-hidden rounded-xl border border-white bg-white shadow-sm shadow-slate-950/[0.03]">
        <div aria-label="Nội dung dashboard" className="grid grid-cols-2">
          <button
            aria-pressed={activeTab === 'qr'}
            className={`min-h-[52px] px-4 text-sm font-semibold transition-colors ${
              activeTab === 'qr'
                ? 'bg-black text-white'
                : 'bg-white text-slate-900 hover:bg-slate-50'
            }`}
            onClick={() => selectTab('qr')}
            type="button"
          >
            QR code
          </button>
          <button
            aria-pressed={activeTab === 'lots'}
            className={`flex min-h-[52px] items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors ${
              activeTab === 'lots'
                ? 'bg-black text-white'
                : 'bg-white text-slate-900 hover:bg-slate-50'
            }`}
            onClick={() => selectTab('lots')}
            type="button"
          >
            Lot Configuration
            <span className="grid size-5 place-items-center rounded-full bg-lime-400 text-[11px] font-bold text-black">
              {lots.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'lots' ? (
        <div className="mt-12">
          <label className="relative block w-full max-w-[262px]">
            <span className="sr-only">Tìm bãi xe</span>
            <Icon
              name="search"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-900"
            />
            <input
              className="h-[42px] w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-lime-300/50"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              type="search"
              value={search}
            />
          </label>

          {saveError ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {saveError}
            </p>
          ) : null}

          {isLotsLoading ? (
            <div className="mt-4 space-y-4" aria-label="Đang tải danh sách bãi xe">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  className="h-[98px] animate-pulse rounded-2xl border border-slate-100 bg-white"
                  key={index}
                />
              ))}
            </div>
          ) : lotsError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-white px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-900">Không tải được dữ liệu bãi xe</p>
              <p className="mt-2 text-sm text-slate-500">{lotsError}</p>
              <button
                className="mt-5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => window.location.reload()}
                type="button"
              >
                Thử lại
              </button>
            </div>
          ) : visibleLots.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">
                {lots.length === 0 ? 'Chưa có bãi xe nào' : 'Không tìm thấy bãi xe'}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {lots.length === 0
                  ? 'Danh sách bãi xe sẽ xuất hiện tại đây khi có dữ liệu.'
                  : 'Thử tìm bằng tên, mã hoặc địa điểm của bãi xe.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {visibleLots.map((lot) => {
                const capacity = draftCapacities[lot.id] ?? lot.capacity
                const isDirty = capacity !== lot.capacity
                const occupancy = capacity > 0
                  ? Math.round((lot.occupiedCount / capacity) * 1000) / 10
                  : 0
                const isNearlyFull = occupancy >= 85

                return (
                  <article
                    className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] sm:grid-cols-[minmax(150px,1fr)_minmax(210px,260px)_minmax(210px,1fr)_auto] sm:items-center"
                    key={lot.id}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-black text-base font-semibold text-white">
                        {getLotMarker(lot.code)}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-slate-950">
                          {lot.name}
                        </h2>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {lot.location || lot.code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 sm:justify-center">
                      <span className="px-1 text-[10px] font-semibold uppercase leading-3 tracking-wide text-slate-500">
                        Max<br />Cap
                      </span>
                      {isAdmin ? (
                        <>
                          <button
                            aria-label={`Giảm sức chứa ${lot.name}`}
                            className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={capacity <= lot.occupiedCount}
                            onClick={() =>
                              setDraftCapacities((current) => ({
                                ...current,
                                [lot.id]: Math.max(lot.occupiedCount, capacity - 10),
                              }))
                            }
                            type="button"
                          >
                            <Icon name="minus" className="size-3.5" />
                          </button>
                          <span className="min-w-12 text-center font-mono text-sm font-semibold text-slate-900">
                            {capacity}
                          </span>
                          <button
                            aria-label={`Tăng sức chứa ${lot.name}`}
                            className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                            onClick={() =>
                              setDraftCapacities((current) => ({
                                ...current,
                                [lot.id]: capacity + 10,
                              }))
                            }
                            type="button"
                          >
                            <Icon name="plus" className="size-3.5" />
                          </button>
                          <button
                            className="rounded-full bg-black px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                            disabled={!isDirty || savingLotId === lot.id}
                            onClick={() => void saveCapacity(lot)}
                            type="button"
                          >
                            {savingLotId === lot.id ? 'Đang lưu' : 'Save'}
                          </button>
                        </>
                      ) : (
                        <span className="px-2 font-mono text-sm font-semibold text-slate-900">
                          {lot.capacity}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
                        <span className="truncate text-slate-600">
                          Live Load: {lot.occupiedCount} / {capacity}
                        </span>
                        <span className={`shrink-0 font-semibold ${isNearlyFull ? 'text-red-600' : 'text-slate-700'}`}>
                          {occupancy.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        aria-label={`Đã sử dụng ${occupancy.toFixed(1)} phần trăm sức chứa`}
                        className="h-2 overflow-hidden rounded-full bg-slate-200"
                        role="img"
                      >
                        <div
                          className={`h-full rounded-full transition-[width] ${isNearlyFull ? 'bg-red-500' : 'bg-lime-400'}`}
                          style={{ width: `${Math.min(100, occupancy)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] leading-4 text-slate-500 sm:text-right">
                      <span className="block">Cập nhật lúc</span>
                      <span className="whitespace-nowrap">{formatTime(lot.updatedAt)}</span>
                      {isAdmin ? null : (
                        <span className="mt-1 block text-[10px] text-slate-400">Chỉ Admin được chỉnh sửa</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8">
          {isAuthLoading ? (
            <div className="mx-auto h-[480px] max-w-[720px] animate-pulse rounded-2xl bg-slate-200" />
          ) : !user ? (
            <form
              className="mx-auto max-w-[480px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              onSubmit={(event) => void handleLogin(event)}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-950">Đăng nhập để xem mã QR</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Mã QR và trạng thái xe được tải trực tiếp từ tài khoản của bạn.
                </p>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Tên đăng nhập
                <input
                  autoComplete="username"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-lime-300/50"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  value={username}
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Mật khẩu
                <input
                  autoComplete="current-password"
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-lime-300/50"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {loginError ? (
                <p className="mt-4 text-sm text-red-600" role="alert">{loginError}</p>
              ) : null}
              <button
                className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                disabled={isLoggingIn}
                type="submit"
              >
                {isLoggingIn ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </button>
            </form>
          ) : isVehiclesLoading && vehicles.length === 0 ? (
            <div className="mx-auto h-[480px] max-w-[720px] animate-pulse rounded-2xl bg-slate-200" />
          ) : vehiclesError ? (
            <div className="mx-auto max-w-[640px] rounded-2xl border border-red-200 bg-white px-6 py-10 text-center">
              <p className="font-semibold text-slate-900">Không tải được thông tin xe</p>
              <p className="mt-2 text-sm text-slate-500">{vehiclesError}</p>
              <button
                className="mt-5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => selectTab('lots')}
                type="button"
              >
                Quay lại tổng quan
              </button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="mx-auto max-w-[640px] rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                <Icon name="vehicles" className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">Bạn chưa đăng ký phương tiện</h2>
              <p className="mt-2 text-sm text-slate-500">Đăng ký xe để theo dõi trạng thái và sử dụng mã QR tại bãi.</p>
              <Link
                className="mt-5 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                to="/user/vehicles"
              >
                Quản lý phương tiện
              </Link>
            </div>
          ) : isVehiclesLoading && vehicles.some((vehicle) => vehicle.status === 'APPROVED') ? (
            <div className="mx-auto h-[480px] max-w-[720px] animate-pulse rounded-2xl bg-slate-200" />
          ) : !vehicleQr ? (
            <div className="mx-auto max-w-[640px] rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-950">Chưa có xe được duyệt</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {vehicles.some((vehicle) => vehicle.status === 'PENDING')
                  ? 'Hồ sơ xe của bạn đang chờ duyệt. Mã QR sẽ xuất hiện sau khi hồ sơ được duyệt.'
                  : 'Chỉ phương tiện đã được duyệt mới có thể sử dụng mã QR.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {vehicles.map((vehicle) => (
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${vehicle.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
                    key={vehicle.id}
                  >
                    {vehicle.licensePlate} · {vehicle.status === 'PENDING' ? 'Chờ duyệt' : vehicle.status === 'REJECTED' ? 'Bị từ chối' : 'Đang khóa'}
                  </span>
                ))}
              </div>
              <Link
                className="mt-5 inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                to="/user/vehicles"
              >
                Xem trạng thái xe
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-[720px] overflow-hidden rounded-2xl bg-[#121212] text-white shadow-xl shadow-slate-950/10">
              <div className="h-1.5 bg-lime-400" />
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200">BK Parking · Mã phương tiện</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-wide">{vehicleQr.licensePlate}</h2>
                    <p className="mt-1 text-sm text-white/60">{vehicleQr.ownerName} · {vehicleQr.ownerCode}</p>
                  </div>
                  {vehicles.filter((vehicle) => vehicle.status === 'APPROVED').length > 1 ? (
                    <label className="text-xs text-white/60">
                      <span className="sr-only">Chọn phương tiện</span>
                      <select
                        className="max-w-[210px] rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                        onChange={(event) => setSelectedVehicleId(Number(event.target.value))}
                        value={selectedVehicleId ?? ''}
                      >
                        {vehicles
                          .filter((vehicle) => vehicle.status === 'APPROVED')
                          .map((vehicle) => (
                            <option className="text-slate-900" key={vehicle.id} value={vehicle.id}>
                              {vehicle.licensePlate}
                            </option>
                          ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="mt-5 rounded-xl bg-white p-4 sm:p-5">
                  <QRCodeSVG
                    bgColor="#ffffff"
                    className="mx-auto h-auto w-full max-w-[230px]"
                    fgColor="#171923"
                    level="M"
                    marginSize={2}
                    value={vehicleQr.qrToken}
                  />
                  <p className="mt-3 text-center text-xs text-slate-500">Quét mã tại cổng để xác thực phương tiện</p>
                </div>

                <div className="mt-4 grid gap-3 rounded-xl bg-white/[0.1] p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Gói đỗ xe</p>
                    <p className="mt-1 font-medium">{vehicleQr.packageEligible ? 'Đang hoạt động' : 'Chưa có gói hiệu lực'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Trạng thái gửi xe</p>
                    <p className="mt-1 font-medium">
                      {vehicleQr.currentlyInParkingLot
                        ? `Đang ở ${vehicleQr.currentParkingLot ?? 'trong bãi'}`
                        : 'Chưa vào bãi'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
