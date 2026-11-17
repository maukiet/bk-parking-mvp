import { PageHeader } from '../../../shared/components/PageHeader'

type UserPortalPageProps = {
  title: string
  description: string
}

export function UserPortalPage({ title, description }: UserPortalPageProps) {
  return (
    <section aria-labelledby="page-title">
      <PageHeader title={title} description={description} />
      <div className="mt-8 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm shadow-slate-950/[0.02]">
        <p className="max-w-md text-sm leading-6 text-slate-500">
          Khu vực nội dung của trang này đã sẵn sàng để ghép tính năng tương ứng.
        </p>
      </div>
    </section>
  )
}
