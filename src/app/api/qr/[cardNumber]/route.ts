import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import QRCode from 'qrcode'

export async function GET(
  request: Request,
  { params }: { params: { cardNumber: string } }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardNumber } = params
    const origin = new URL(request.url).origin
    const url = `${origin}/client?card=${encodeURIComponent(cardNumber)}`

    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    return new NextResponse(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
