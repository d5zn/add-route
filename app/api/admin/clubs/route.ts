import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth } from '@/lib/auth'

/**
 * GET /api/admin/clubs
 * Get all clubs
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAdminAuth()
    
    const clubs = await prisma.club.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            templates: true,
          },
        },
      },
    })
    
    return NextResponse.json(clubs, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching clubs:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch clubs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/clubs
 * Create a new club
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAdminAuth()
    
    const body = await request.json()
    const { id, name, slug, description, logoAssetId, theme } = body
    
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }
    
    const club = await prisma.club.create({
      data: {
        id: id || slug,
        name,
        slug,
        description,
        logoAssetId,
        theme: theme || {},
        status: 'active',
      },
    })
    
    return NextResponse.json(club, { status: 201 })
  } catch (error: any) {
    console.error('Error creating club:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Club with this ID or slug already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    )
  }
}

