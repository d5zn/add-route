import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth } from '@/lib/auth'
import { nanoid } from 'nanoid'
import { validateAndNormalizeTemplate } from '@/lib/validation'

/**
 * GET /api/admin/templates?clubId=X
 * Get all templates (optionally filtered by clubId)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth()
    
    const searchParams = request.nextUrl.searchParams
    const clubId = searchParams.get('clubId')
    
    const templates = await prisma.template.findMany({
      where: clubId ? { clubId } : undefined,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
    
    return NextResponse.json(templates, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/templates
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth()
    
    const body = await request.json()
    const { id, clubId, name, description, tags, pages, status } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    // Validate and normalize template data
    let validatedPages = pages || []
    if (pages && Array.isArray(pages)) {
      try {
        // Validate each page structure
        validatedPages = pages.map((page: any) => {
          try {
            return validateAndNormalizeTemplate({
              id: id || nanoid(),
              name,
              description,
              tags: tags || [],
              pages: [page],
              version: 1,
              status: status || 'draft',
            }).pages[0]
          } catch {
            return page // Use as-is if validation fails
          }
        })
      } catch (error) {
        console.warn('Template validation warning:', error)
      }
    }
    
    const template = await prisma.template.create({
      data: {
        id: id || nanoid(),
        clubId,
        name,
        description,
        tags: tags || [],
        pages: validatedPages,
        status: status || 'draft',
        version: 1,
      },
    })
    
    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Error creating template:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Template with this ID already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

