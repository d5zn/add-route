import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAndNormalizeTemplate } from '@/lib/validation'

/**
 * GET /api/templates?clubId=X
 * Get templates for a specific club
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clubId = searchParams.get('clubId')
    
    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId parameter is required' },
        { status: 400 }
      )
    }
    
    // Get published templates for the club
    const templates = await prisma.template.findMany({
      where: {
        clubId,
        status: 'published',
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
        pages: true,
        createdAt: true,
        updatedAt: true,
        version: true,
      },
    })
    
    // Validate and normalize templates (for backward compatibility)
    const validatedTemplates = templates.map((template) => {
      try {
        return validateAndNormalizeTemplate(template)
      } catch (error) {
        console.warn(`Template ${template.id} validation failed, using as-is:`, error)
        return template as any
      }
    })
    
    return NextResponse.json(validatedTemplates, { status: 200 })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

