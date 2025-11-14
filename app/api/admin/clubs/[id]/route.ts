import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth } from '@/lib/auth'

/**
 * GET /api/admin/clubs/:id
 * Get a club by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        templates: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    })
    
    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(club, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching club:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch club' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/clubs/:id
 * Update a club
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    const body = await request.json()
    
    const { name, slug, description, logoAssetId, theme, status } = body
    
    const club = await prisma.club.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(logoAssetId !== undefined && { logoAssetId }),
        ...(theme && { theme }),
        ...(status && { status }),
      },
    })
    
    return NextResponse.json(club, { status: 200 })
  } catch (error: any) {
    console.error('Error updating club:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update club' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/clubs/:id
 * Delete a club
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    
    await prisma.club.delete({
      where: { id },
    })
    
    return NextResponse.json(
      { success: true, message: 'Club deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting club:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete club' },
      { status: 500 }
    )
  }
}

