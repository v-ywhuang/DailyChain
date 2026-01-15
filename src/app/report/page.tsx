import { Suspense } from 'react'
import ReportContent from './report-content'
import { GlobalLoadingBar } from '@/components/global-loading'

export const metadata = {
  title: '习惯报告 - DailyChain',
  description: '查看你的习惯养成报告',
}

export default function ReportPage() {
  return (
    <Suspense fallback={<GlobalLoadingBar />}>
      <ReportContent />
    </Suspense>
  )
}
