import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const roomId = searchParams.get('roomId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      dateFilter.lte = to
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        hotelId: user.hotelId,
        ...(roomId && { guest: { roomId } }),
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mealPlan: true,
            room: { select: { number: true, floor: true } },
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'csv') {
      const headers = ['Date', 'Guest', 'Room', 'Type', 'Meal Type', 'Credit Type', 'Amount', 'Status', 'Staff']
      const rows = transactions.map((t) => [
        new Date(t.createdAt).toISOString(),
        `${t.guest.firstName} ${t.guest.lastName}`,
        t.guest.room.number,
        t.type,
        t.mealType ?? '',
        t.creditType ?? '',
        t.amount.toString(),
        t.status,
        t.user.name,
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    if (format === 'pdf') {
      const dateLabel = dateFrom || dateTo
        ? `${dateFrom ?? ''} – ${dateTo ?? ''}`
        : 'All dates'

      const rows = transactions
        .map(
          (t) => `
          <tr>
            <td>${new Date(t.createdAt).toLocaleString()}</td>
            <td>${t.guest.firstName} ${t.guest.lastName}</td>
            <td>${t.guest.room.number}</td>
            <td>${t.type}</td>
            <td>${t.mealType ?? '-'}</td>
            <td>${t.creditType ?? '-'}</td>
            <td>${t.amount}</td>
            <td>${t.status}</td>
            <td>${t.user.name}</td>
          </tr>`
        )
        .join('')

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Transactions Export</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p { margin: 0 0 12px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background: #fafafa; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Transaction Report</h1>
  <p>Period: ${dateLabel} &nbsp;|&nbsp; Total: ${transactions.length} transactions</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Guest</th>
        <th>Room</th>
        <th>Type</th>
        <th>Meal Type</th>
        <th>Credit Type</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Staff</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`

      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return NextResponse.json({ error: 'Invalid format. Use "csv" or "pdf"' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
