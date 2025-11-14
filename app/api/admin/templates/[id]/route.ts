import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth } from '@/lib/auth'
import { validateAndNormalizeTemplate } from '@/lib/validation'

/**
 * GET /api/admin/templates/:id
 * Get a template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            theme: true,
          },
        },
      },
    })
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(template, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching template:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/templates/:id
 * Update a template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    const body = await request.json()
    
    const { clubId, name, description, tags, pages, status, version } = body
    
    // Get current template to increment version
    const currentTemplate = await prisma.template.findUnique({
      where: { id },
      select: { version: true },
    })
    
    if (!currentTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Validate and normalize pages if provided
    let validatedPages = pages
    if (pages && Array.isArray(pages)) {
      try {
        const fullTemplate = {
          id,
          name: name || 'Template',
          description,
          tags: tags || [],
          pages,
          version: version || currentTemplate.version + 1,
          status: status || 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const validated = validateAndNormalizeTemplate(fullTemplate)
        validatedPages = validated.pages
      } catch (error) {
        console.warn('Template validation warning:', error)
        // Continue with original pages if validation fails
      }
    }
    
    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(clubId !== undefined && { clubId }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(tags && { tags }),
        ...(validatedPages && { pages: validatedPages }),
        ...(status && { status }),
        version: version || currentTemplate.version + 1,
      },
    })
    
    return NextResponse.json(template, { status: 200 })
  } catch (error: any) {
    console.error('Error updating template:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/templates/:id
 * Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    
    await prisma.template.delete({
      where: { id },
    })
    
    return NextResponse.json(
      { success: true, message: 'Template deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting template:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

