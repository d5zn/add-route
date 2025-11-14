import { NextRequest, NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await clearAdminSession()
    
    return NextResponse.json(
      { success: true, message: 'Logout successful' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

