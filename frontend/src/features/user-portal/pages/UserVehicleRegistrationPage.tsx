import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../../shared/api/apiClient'
import { useAuth } from '../../../shared/auth/AuthContext'
import { Icon } from '../../../shared/components/Icon'
import { PageHeader } from '../../../shared/components/PageHeader'
import type { VehicleEligibilityDto, VehicleOwnerRelationship, VehicleType } from '../../../types/api'
import { getVehicleEligibility, registerVehicle, uploadVehicleDocument } from '../vehiclesApi'

const vehicleLabels: Record<VehicleType, { title: string; note: string }> = {
  MOTORBIKE: { title: 'Xe máy', note: 'Xe máy xăng' },
  ELECTRIC_BIKE: { title: 'Xe điện', note: 'Xe máy điện hoặc xe đạp điện' },
  BICYCLE: { title: 'Xe đạp', note: 'Xe đạp cá nhân' },
  CAR: { title: 'Ô tô', note: 'Chỉ dành cho cán bộ, giảng viên' },
}

const maxFileSize = 5 * 1024 * 1024

function usePreviewUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])
  return url
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 413) return 'Ảnh vượt quá dung lượng cho phép 5 MB.'
  if (error instanceof ApiError && error.status === 415) return 'Chỉ hỗ trợ ảnh JPEG hoặc PNG.'
  return error instanceof Error ? error.message : 'Không gửi được hồ sơ. Vui lòng thử lại.'
}

function DocumentField({ id, title, detail, required, file, onChange }: {
  id: string
  title: string
  detail: string
  required?: boolean
  file: File | null
  onChange: (file: File | null, error: string) => void
}) {
  const previewUrl = usePreviewUrl(file)

  function selectFile(nextFile?: File) {
    if (!nextFile) {
      onChange(null, '')
      return
    }
    if (!['image/jpeg', 'image/png'].includes(nextFile.type)) {
      onChange(null, 'Vui lòng chọn ảnh JPG hoặc PNG.')
      return
    }
    if (nextFile.size > maxFileSize) {
      onChange(null, 'Ảnh không được vượt quá 5 MB.')
      return
    }
    onChange(nextFile, '')
  }

  return (
    <div>
      <label htmlFor={id} className="group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center transition-colors hover:border-slate-500 hover:bg-slate-50">
        {previewUrl ? (
          <img src={previewUrl} alt={`Xem trước: ${title}`} className="mb-3 max-h-24 rounded-lg object-contain" />
        ) : (
          <span className="mb-2 grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon name="plus" className="size-5" /></span>
        )}
        <span className="text-sm font-semibold text-slate-900">{file ? file.name : title}{required && !file ? ' *' : ''}</span>
        <span className="mt-1 text-xs text-slate-500">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Nhấn để đổi ảnh` : detail}</span>
      </label>
      <input id={id} type="file" accept="image/jpeg,image/png" required={required} className="sr-only" onChange={(event) => selectFile(event.currentTarget.files?.[0])} />
    </div>
  )
}

export function UserVehicleRegistrationPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [eligibility, setEligibility] = useState<VehicleEligibilityDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [error, setError] = useState('')
  const [successPlate, setSuccessPlate] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTORBIKE')
  const [relationship, setRelationship] = useState<VehicleOwnerRelationship>('SELF')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isRetryingEligibility, setIsRetryingEligibility] = useState(false)

  useEffect(() => {
    if (isAuthLoading || !user || user.role !== 'ROLE_USER') return
    let cancelled = false
    setLoading(true)
    setLoadingError('')
    getVehicleEligibility()
      .then((result) => {
        if (cancelled) return
        setEligibility(result)
        const allowed = result.allowedVehicleTypes as VehicleType[]
        if (!allowed.includes(vehicleType)) setVehicleType(allowed.includes('MOTORBIKE') ? 'MOTORBIKE' : (allowed[0] ?? 'MOTORBIKE'))
      })
      .catch((reason: unknown) => { if (!cancelled) setLoadingError(reason instanceof Error ? reason.message : 'Không tải được hạn mức đăng ký.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isAuthLoading, user?.id, user?.role])

  async function retryEligibility() {
    if (isRetryingEligibility) return

    setIsRetryingEligibility(true)
    try {
      const result = await getVehicleEligibility()
      setEligibility(result)
      const allowed = result.allowedVehicleTypes as VehicleType[]
      setVehicleType((current) => (
        allowed.includes(current)
          ? current
          : (allowed.includes('MOTORBIKE') ? 'MOTORBIKE' : (allowed[0] ?? 'MOTORBIKE'))
      ))
      setLoadingError('')
    } catch (reason) {
      setLoadingError(reason instanceof Error ? reason.message : 'Không tải được hạn mức đăng ký.')
    } finally {
      setIsRetryingEligibility(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!eligibility?.canRegister) {
      setError('Tài khoản đã đạt hạn mức đăng ký phương tiện.')
      return
    }
    if (!eligibility.allowedVehicleTypes.includes(vehicleType)) {
      setError('Loại phương tiện này chưa được phép đăng ký cho tài khoản của bạn.')
      return
    }
    if (!frontFile || !backFile) {
      setError('Vui lòng tải lên cả mặt trước và mặt sau giấy đăng ký xe.')
      return
    }
    if (!acceptedTerms) {
      setError('Vui lòng xác nhận thông tin khai báo chính xác.')
      return
    }

    setSubmitting(true)
    try {
      const [front, back] = await Promise.all([
        uploadVehicleDocument(frontFile, 'REGISTRATION_FRONT'),
        uploadVehicleDocument(backFile, 'REGISTRATION_BACK'),
      ])
      const photo = photoFile ? await uploadVehicleDocument(photoFile, 'VEHICLE_PHOTO') : null
      const saved = await registerVehicle({
        licensePlate: licensePlate.trim().toUpperCase(),
        vehicleType,
        ownerRelationship: relationship,
        registrationDocFrontId: front.id,
        registrationDocBackId: back.id,
        ...(photo ? { vehiclePhotoId: photo.id } : {}),
      })
      setSuccessPlate(saved.licensePlate)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setSubmitting(false)
    }
  }

  if (isAuthLoading) return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
  if (!user) return <RegistrationNotice title="Đăng nhập để đăng ký xe" message="Đăng nhập bằng tài khoản người dùng để gửi hồ sơ phương tiện." />
  if (user.role !== 'ROLE_USER') return <RegistrationNotice title="Trang dành cho tài khoản người dùng" message="Tài khoản hiện tại không có quyền đăng ký phương tiện cá nhân." />
  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
  if (successPlate) return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-lime-200 bg-white p-7 text-center sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-lime-100 text-xl font-bold text-lime-800">✓</span>
      <h1 className="mt-4 text-2xl font-bold">Đã gửi đăng ký xe</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Hồ sơ <strong className="text-slate-900">{successPlate}</strong> đang chờ quản trị viên duyệt. Trạng thái sẽ được cập nhật trong trang quản lý phương tiện.</p>
      <Link to="/user/vehicles" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-black px-5 text-sm font-semibold text-white">Quay lại phương tiện của tôi</Link>
    </section>
  )

  const allowedTypes = (eligibility?.allowedVehicleTypes ?? []) as VehicleType[]

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Đăng ký xe mới" description="Gửi thông tin và giấy tờ phương tiện để được xét duyệt." action={<Link to="/user/vehicles" className="text-sm font-semibold text-slate-600 underline underline-offset-4">Quay lại danh sách</Link>} />

      {loadingError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          <span>{loadingError}</span>
          <button
            type="button"
            onClick={() => void retryEligibility()}
            disabled={isRetryingEligibility}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-3 font-semibold underline disabled:cursor-wait disabled:opacity-60"
          >
            {isRetryingEligibility ? 'Đang tải lại…' : 'Thử tải lại'}
          </button>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">{error}</p>}
      {eligibility && !eligibility.canRegister && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">Tài khoản đã đạt hạn mức {eligibility.maxVehicleLimit} phương tiện. Bạn có thể hủy xe không còn sử dụng tại trang quản lý.</p>}

      <form onSubmit={(event) => void submit(event)} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.02] sm:p-7">
        <fieldset disabled={submitting || !eligibility?.canRegister} className="space-y-6 disabled:opacity-70">
          <div>
            <legend className="text-xs font-bold uppercase tracking-wide">1. Loại phương tiện <span className="text-red-600">*</span></legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {allowedTypes.map((type) => (
                <label key={type} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${vehicleType === type ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-400' : 'border-slate-200 hover:border-slate-400'}`}>
                  <input type="radio" name="vehicleType" value={type} checked={vehicleType === type} onChange={() => setVehicleType(type)} required />
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black text-lime-300"><Icon name="vehicles" className="size-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{vehicleLabels[type].title}</span><span className="mt-0.5 block text-xs text-slate-500">{vehicleLabels[type].note}</span></span>
                  {type === 'CAR' && <span className="rounded-full border border-slate-300 px-2 py-1 text-[10px] font-semibold">Chỉ GV/NV</span>}
                </label>
              ))}
              {!allowedTypes.length && <p className="text-sm text-slate-500">Không có loại phương tiện khả dụng cho tài khoản.</p>}
            </div>
          </div>

          <div>
            <label htmlFor="license-plate" className="text-xs font-bold uppercase tracking-wide">2. Biển số xe <span className="text-red-600">*</span></label>
            <div className="mt-3 flex h-12 items-center gap-3 rounded-full border border-slate-300 px-4 focus-within:border-slate-500">
              <span className="rounded bg-amber-300 px-2 py-0.5 text-[10px] font-bold">VN</span>
              <span className="h-5 w-px bg-slate-300" />
              <input id="license-plate" value={licensePlate} onChange={(event) => setLicensePlate(event.target.value)} required maxLength={20} placeholder="59G2-988.76" className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm font-semibold uppercase outline-none placeholder:font-normal placeholder:text-slate-400" />
            </div>
            <p className="mt-2 text-xs text-slate-500">Nhập đúng biển kiểm soát, bao gồm dấu gạch ngang và dấu chấm nếu có.</p>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><h2 className="text-xs font-bold uppercase tracking-wide">3. Ảnh giấy đăng ký xe <span className="text-red-600">*</span></h2><p className="mt-1 text-xs text-slate-500">Chụp rõ thông tin; hỗ trợ JPG, PNG, tối đa 5 MB mỗi ảnh.</p></div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DocumentField id="registration-front" title="Mặt trước cà vẹt" detail="Chọn ảnh JPG hoặc PNG · tối đa 5 MB" required file={frontFile} onChange={(file, message) => { setFrontFile(file); setFileErrors((current) => ({ ...current, front: message })) }} />
              <DocumentField id="registration-back" title="Mặt sau cà vẹt" detail="Chọn ảnh JPG hoặc PNG · tối đa 5 MB" required file={backFile} onChange={(file, message) => { setBackFile(file); setFileErrors((current) => ({ ...current, back: message })) }} />
            </div>
            {(fileErrors.front || fileErrors.back) && <p role="alert" className="mt-2 text-xs text-red-700">{fileErrors.front || fileErrors.back}</p>}
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide">4. Ảnh thực tế phương tiện <span className="font-normal text-slate-500">(tùy chọn)</span></h2>
            <p className="mt-1 text-xs text-slate-500">Ảnh giúp đối chiếu phương tiện tại cổng.</p>
            <div className="mt-3">
              <DocumentField id="vehicle-photo" title="Tải ảnh chụp góc rộng của xe" detail="Chọn ảnh JPG hoặc PNG · tối đa 5 MB" file={photoFile} onChange={(file, message) => { setPhotoFile(file); setFileErrors((current) => ({ ...current, photo: message })) }} />
            </div>
            {fileErrors.photo && <p role="alert" className="mt-2 text-xs text-red-700">{fileErrors.photo}</p>}
          </div>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide">5. Chủ sở hữu và mối quan hệ</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {([['SELF', 'Chính chủ', 'Đứng tên trên giấy tờ'], ['RELATIVE', 'Xe người thân', 'Bố mẹ, vợ hoặc chồng']] as [VehicleOwnerRelationship, string, string][]).map(([value, title, detail]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50">
                  <input type="radio" name="ownerRelationship" value={value} checked={relationship === value} onChange={() => setRelationship(value)} />
                  <span><span className="block text-sm font-medium">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{detail}</span></span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Phí gửi xe và điều kiện sử dụng được áp dụng theo chính sách tài khoản và loại phương tiện. Hệ thống hiện tiếp nhận hồ sơ đăng ký; trạng thái chờ duyệt sẽ hiển thị sau khi gửi.
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-6 text-slate-700">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1" />
            <span>Tôi cam kết thông tin khai báo là chính xác và tuân thủ nội quy bãi xe.</span>
          </label>
        </fieldset>

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-5 sm:flex-row">
          <Link to="/user/vehicles" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Hủy bỏ</Link>
          <button type="submit" disabled={submitting || !eligibility?.canRegister || !eligibility.allowedVehicleTypes.includes(vehicleType)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Đang gửi hồ sơ…' : 'Gửi đăng ký xe'} <span aria-hidden="true" className="text-lime-300">➤</span>
          </button>
        </div>
      </form>
    </section>
  )
}

function RegistrationNotice({ title, message }: { title: string; message: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center"><h1 className="text-xl font-bold">{title}</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{message}</p><Link to="/login?next=%2Fuser%2Fvehicles%2Fnew" className="mt-5 inline-flex min-h-10 items-center rounded-full bg-black px-5 text-sm font-semibold text-white">Đăng nhập</Link></section>
}
