import { useEffect, useRef, useState, useCallback } from 'react'
import { Box } from '@mui/material'
import { useEditorStore } from '../../store/useEditorStore'
import type { Page, EditorElement, TextElement, ShapeElement, ImageElement } from '../../types'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT_9_16 = 1920
const CANVAS_HEIGHT_4_5 = 1350

// Instagram safe zones (top and bottom areas that may be cut off)
const INSTAGRAM_SAFE_ZONE_TOP_9_16 = 250 // Top safe area for 9:16
const INSTAGRAM_SAFE_ZONE_TOP_4_5 = 160 // Top safe area for 4:5
const INSTAGRAM_SAFE_ZONE_BOTTOM = 100 // Bottom safe area (same for both)

export const NativeCanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 })

  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)
  const aspectRatio = useEditorStore((store) => store.state.ui.aspectRatio || '9:16')
  const selectElements = useEditorStore((store) => store.selectElements)
  const moveElement = useEditorStore((store) => store.moveElement)

  const page = template.pages.find((p) => p.id === pageId) || template.pages[0]

  // Calculate fit-to-screen scale
  useEffect(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    
    const updateSize = () => {
      // Force layout recalculation by reading offsetHeight
      const rect = container.getBoundingClientRect()
      const width = rect.width || container.offsetWidth || container.clientWidth || window.innerWidth
      const height = rect.height || container.offsetHeight || container.clientHeight || window.innerHeight

      if (width === 0 || height === 0) {
        // If still no size, try to get from parent
        const parent = container.parentElement
        if (parent) {
          const parentRect = parent.getBoundingClientRect()
          const parentHeight = parentRect.height || parent.offsetHeight || parent.clientHeight
          if (parentHeight > 0 && height === 0) {
            // Force container height from parent
            container.style.height = `${parentHeight}px`
            setTimeout(updateSize, 50)
            return
          }
        }
        // Retry after a short delay if container has no size
        setTimeout(updateSize, 100)
        return
      }

        // Get current canvas height based on aspect ratio
        const currentCanvasHeight = aspectRatio === '4:5' ? CANVAS_HEIGHT_4_5 : CANVAS_HEIGHT_9_16

        // If no page, still set up container
        if (!page) {
          setScale(1)
          setPan({ x: (width - CANVAS_WIDTH) / 2, y: (height - currentCanvasHeight) / 2 })
          return
        }

        // Calculate scale to fit canvas
        const scaleX = (width - 64) / CANVAS_WIDTH
        const scaleY = (height - 64) / currentCanvasHeight
        const fitScale = Math.min(scaleX, scaleY, 1)
        setScale(fitScale)

        // Center canvas
        const scaledWidth = CANVAS_WIDTH * fitScale
        const scaledHeight = currentCanvasHeight * fitScale
        setPan({
          x: (width - scaledWidth) / 2,
          y: (height - scaledHeight) / 2,
        })
    }

    // Initial update
    updateSize()
    
    // Use ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(() => {
      updateSize()
    })
    resizeObserver.observe(container)

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [page, aspectRatio])

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('Canvas ref is null')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn('Could not get 2d context')
      return
    }

    // Get current canvas dimensions based on aspect ratio
    const currentCanvasHeight = aspectRatio === '4:5' ? CANVAS_HEIGHT_4_5 : CANVAS_HEIGHT_9_16
    const currentSafeZoneTop = aspectRatio === '4:5' ? INSTAGRAM_SAFE_ZONE_TOP_4_5 : INSTAGRAM_SAFE_ZONE_TOP_9_16

    // Set canvas size
    canvas.width = CANVAS_WIDTH
    canvas.height = currentCanvasHeight

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, currentCanvasHeight)

    if (!page) {
      // Render placeholder if no page
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, CANVAS_WIDTH, currentCanvasHeight)
      ctx.fillStyle = '#666666'
      ctx.font = '32px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Нет страницы', CANVAS_WIDTH / 2, currentCanvasHeight / 2)
      return
    }

    // Render background
    renderBackground(ctx, page, currentCanvasHeight)

    // Render overlay layer first (if exists)
    const overlayLayer = page.layers?.find((l) => l.name === 'Overlay')
    if (overlayLayer && overlayLayer.visible) {
      overlayLayer.elements
        ?.filter((element) => element.visible)
        .forEach((element) => {
          renderElement(ctx, element, false)
        })
    }

    // Render all other layers
    page.layers
      ?.filter((layer) => layer.visible && layer.name !== 'Overlay')
      .forEach((layer) => {
        layer.elements
          ?.filter((element) => element.visible)
          .forEach((element) => {
            renderElement(ctx, element, selectedElementIds.includes(element.id))
          })
      })

    // Render Instagram safe zones (after content, so they appear on top)
    renderSafeZones(ctx, currentCanvasHeight, currentSafeZoneTop)
  }, [page, selectedElementIds, aspectRatio])

  useEffect(() => {
    render()
  }, [render])

  // Force initial render after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      render()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Re-render when elements change
  const elements = page?.layers?.flatMap((layer) => layer.elements || []) || []
  useEffect(() => {
    render()
  }, [elements, render])

  // Re-render when images load
  useEffect(() => {
    const unsubscribe = addImageLoadCallback(() => {
      render()
    })
    return unsubscribe
  }, [render])

  // Preload images for all image elements
  useEffect(() => {
    elements
      .filter((el) => el.kind === 'image')
      .forEach((el) => {
        const imgEl = el as ImageElement
        if (imgEl.assetId) {
          const imagePaths = [`/assets/${imgEl.assetId}`, `/route/assets/${imgEl.assetId}`, `/${imgEl.assetId}`]
          imagePaths.forEach((path) => {
            loadImage(path).catch(() => {
              // Ignore errors
            })
          })
        }
      })
  }, [elements])

  // Mouse handlers
  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null

      const rect = containerRef.current.getBoundingClientRect()
      const x = (clientX - rect.left - pan.x) / scale
      const y = (clientY - rect.top - pan.y) / scale

      return { x, y }
    },
    [pan, scale],
  )

  const findElementAtPoint = useCallback(
    (x: number, y: number): EditorElement | null => {
      // Check elements in reverse order (top to bottom)
      for (let i = page.layers.length - 1; i >= 0; i--) {
        const layer = page.layers[i]
        if (!layer.visible) continue

        for (let j = layer.elements.length - 1; j >= 0; j--) {
          const element = layer.elements[j]
          if (!element.visible) continue

          if (isPointInElement(x, y, element)) {
            return element
          }
        }
      }
      return null
    },
    [page],
  )

  const isPointInElement = (x: number, y: number, element: EditorElement): boolean => {
    switch (element.kind) {
      case 'text': {
        const textEl = element as TextElement
        return (
          x >= textEl.position.x &&
          x <= textEl.position.x + textEl.box.width &&
          y >= textEl.position.y &&
          y <= textEl.position.y + textEl.box.height
        )
      }
      case 'image': {
        const imgEl = element as ImageElement
        return (
          x >= imgEl.position.x &&
          x <= imgEl.position.x + imgEl.box.width &&
          y >= imgEl.position.y &&
          y <= imgEl.position.y + imgEl.box.height
        )
      }
      case 'shape': {
        const shapeEl = element as ShapeElement
        // Simple bounding box check for shapes
        return (
          x >= shapeEl.position.x &&
          x <= shapeEl.position.x + shapeEl.box.width &&
          y >= shapeEl.position.y &&
          y <= shapeEl.position.y + shapeEl.box.height
        )
      }
      default:
        return false
    }
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e.clientX, e.clientY)
      if (!point) return

      const element = findElementAtPoint(point.x, point.y)
      if (element) {
        setSelectedElementId(element.id)
        selectElements([element.id])
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setElementStartPos({ x: element.position.x, y: element.position.y })
      } else {
        selectElements([])
        setSelectedElementId(null)
      }
    },
    [getCanvasPoint, findElementAtPoint, selectElements],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !selectedElementId) return

      const point = getCanvasPoint(e.clientX, e.clientY)
      if (!point) return

      const deltaX = (e.clientX - dragStart.x) / scale
      const deltaY = (e.clientY - dragStart.y) / scale

      moveElement(selectedElementId, {
        x: elementStartPos.x + deltaX,
        y: elementStartPos.y + deltaY,
      })
    },
    [isDragging, selectedElementId, dragStart, elementStartPos, scale, getCanvasPoint, moveElement],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Wheel handler for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newScale = Math.max(0.1, Math.min(5, scale + delta))
      setScale(newScale)
    },
    [scale],
  )

  // Always render canvas, even if no page

  const currentCanvasHeight = aspectRatio === '4:5' ? CANVAS_HEIGHT_4_5 : CANVAS_HEIGHT_9_16
  const displayWidth = CANVAS_WIDTH * scale
  const displayHeight = currentCanvasHeight * scale

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: '1 1 0%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        minHeight: 0,
        alignSelf: 'stretch',
      }}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: pan.x,
          top: pan.y,
          width: displayWidth,
          height: displayHeight,
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'block',
          backgroundColor: '#1a1a1a',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </Box>
  )
}

function renderSafeZones(ctx: CanvasRenderingContext2D, canvasHeight: number, safeZoneTop: number) {
  // Draw top safe zone (may be cut off in Instagram)
  ctx.save()
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)' // Semi-transparent red
  ctx.fillRect(0, 0, CANVAS_WIDTH, safeZoneTop)
  
  // Draw bottom safe zone (may be cut off in Instagram)
  ctx.fillRect(0, canvasHeight - INSTAGRAM_SAFE_ZONE_BOTTOM, CANVAS_WIDTH, INSTAGRAM_SAFE_ZONE_BOTTOM)
  
  // Draw border lines
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  
  // Top border
  ctx.beginPath()
  ctx.moveTo(0, safeZoneTop)
  ctx.lineTo(CANVAS_WIDTH, safeZoneTop)
  ctx.stroke()
  
  // Bottom border
  ctx.beginPath()
  ctx.moveTo(0, canvasHeight - INSTAGRAM_SAFE_ZONE_BOTTOM)
  ctx.lineTo(CANVAS_WIDTH, canvasHeight - INSTAGRAM_SAFE_ZONE_BOTTOM)
  ctx.stroke()
  
  ctx.restore()
  
  // Add labels
  ctx.save()
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
  ctx.font = '12px Inter'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.setLineDash([])
  
  // Top label
  ctx.fillText('⚠️ Safe Zone Top', CANVAS_WIDTH / 2, safeZoneTop / 2)
  
  // Bottom label
  ctx.fillText('⚠️ Safe Zone Bottom', CANVAS_WIDTH / 2, canvasHeight - INSTAGRAM_SAFE_ZONE_BOTTOM / 2)
  
  ctx.restore()
}

// Render functions
function renderBackground(ctx: CanvasRenderingContext2D, page: Page, canvasHeight: number) {
  if (page.background?.gradient) {
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, canvasHeight)
    page.background.gradient.stops.forEach((stop) => {
      gradient.addColorStop(stop.offset, stop.color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight)
  } else if (page.background?.color) {
    ctx.fillStyle = page.background.color
    ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight)
  } else {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight)
  }
}

function renderElement(ctx: CanvasRenderingContext2D, element: EditorElement, isSelected: boolean) {
  ctx.save()

  switch (element.kind) {
    case 'text':
      renderTextElement(ctx, element as TextElement, isSelected)
      break
    case 'shape':
      renderShapeElement(ctx, element as ShapeElement, isSelected)
      break
    case 'image':
      renderImageElement(ctx, element as ImageElement, isSelected)
      break
  }

  ctx.restore()
}

function renderTextElement(ctx: CanvasRenderingContext2D, element: TextElement, isSelected: boolean) {
  const { position, content, style, box } = element

  ctx.fillStyle = style.fill
  ctx.textAlign = style.textAlign as CanvasTextAlign
  ctx.textBaseline = 'top'

  // Handle multiline text
  const lines = content.split('\n')
  const lineHeight = style.lineHeight
  let currentY = position.y

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // For metrics: first line is label (normal weight, fontSize), second line is value (bold, fontSize * 1.625)
    // Check if this looks like a metric (has label and value on separate lines)
    const isMetricValue = i === 1 && lines.length === 2 && lines[0].toUpperCase() === lines[0]
    
    if (isMetricValue) {
      // Value line: bold, larger font (52px = 32 * 1.625)
      ctx.font = `bold ${Math.floor(style.fontSize * 1.625)}px ${style.fontFamily}`
    } else {
      // Label line or regular text: use style as is
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
    }
    
    let x = position.x
    if (style.textAlign === 'center') {
      x = position.x + box.width / 2
    } else if (style.textAlign === 'right') {
      x = position.x + box.width
    }
    
    ctx.fillText(line, x, currentY)
    
    // For metrics, add spacing between label and value (10px from main app)
    if (i === 0 && lines.length === 2) {
      currentY += 10 // Spacing between label and value
    } else {
      currentY += lineHeight
    }
  }

  // Draw selection border
  if (isSelected) {
    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 2
    ctx.strokeRect(position.x - 2, position.y - 2, box.width + 4, box.height + 4)
  }
}

function renderShapeElement(ctx: CanvasRenderingContext2D, element: ShapeElement, isSelected: boolean) {
  if (element.shape === 'custom' && element.points && element.points.length > 0) {
    ctx.beginPath()
    ctx.moveTo(element.position.x + element.points[0].x, element.position.y + element.points[0].y)

    for (let i = 1; i < element.points.length; i++) {
      ctx.lineTo(element.position.x + element.points[i].x, element.position.y + element.points[i].y)
    }

    if (element.stroke) {
      // Check if stroke has gradient
      if (element.stroke.gradient) {
        const gradient = element.stroke.gradient
        // Calculate gradient bounds from points
        const minY = Math.min(...element.points.map(p => element.position.y + p.y))
        const maxY = Math.max(...element.points.map(p => element.position.y + p.y))
        const centerX = element.position.x + element.box.width / 2
        
        // Create linear gradient (vertical by default)
        const canvasGradient = ctx.createLinearGradient(
          centerX, minY,
          centerX, maxY
        )
        
        gradient.stops.forEach((stop: { offset: number; color: string }) => {
          canvasGradient.addColorStop(stop.offset, stop.color)
        })
        
        ctx.strokeStyle = canvasGradient
      } else {
        ctx.strokeStyle = element.stroke.color || '#000000'
      }
      
      ctx.lineWidth = element.stroke.width || 1
      ctx.lineCap = element.stroke.cap || 'round'
      ctx.lineJoin = element.stroke.join || 'round'
      ctx.stroke()
    }
  } else if (element.shape === 'rectangle') {
    ctx.fillStyle = element.fill?.color || '#000000'
    ctx.fillRect(element.position.x, element.position.y, element.box.width, element.box.height)
  }

  // Draw selection border
  if (isSelected) {
    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 2
    ctx.strokeRect(element.position.x - 2, element.position.y - 2, element.box.width + 4, element.box.height + 4)
  }
}

// Image cache with callbacks for re-rendering
const imageCache = new Map<string, HTMLImageElement>()
const imageLoadCallbacks = new Set<() => void>()

function addImageLoadCallback(callback: () => void) {
  imageLoadCallbacks.add(callback)
  return () => {
    imageLoadCallbacks.delete(callback)
  }
}

function notifyImageLoaded() {
  imageLoadCallbacks.forEach((callback) => callback())
}

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!
    if (cached.complete) {
      return Promise.resolve(cached)
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(src, img)
      notifyImageLoaded()
      resolve(img)
    }
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`))
    }
    img.src = src
  })
}

function renderImageElement(ctx: CanvasRenderingContext2D, element: ImageElement, isSelected: boolean) {
  const { position, box, assetId } = element

  // Try to load image
  if (assetId) {
    // Logo paths from main app: /logo_NIP.svg, /logo_HC.png
    const imagePaths = [
      `/${assetId}`,  // Root path (main app uses root paths)
      `/route/${assetId}`,
      `/assets/${assetId}`,
      `/route/assets/${assetId}`,
      `https://stg.addicted.design/${assetId}`,
      `https://stg.addicted.design/route/${assetId}`,
      `https://stg.addicted.design/assets/${assetId}`,
      `https://stg.addicted.design/route/assets/${assetId}`,
    ]

    // Try to get cached image
    let image: HTMLImageElement | null = null
    for (const path of imagePaths) {
      if (imageCache.has(path)) {
        image = imageCache.get(path)!
        if (image.complete) {
          break
        }
      }
    }

    if (image && image.complete) {
      ctx.drawImage(image, position.x, position.y, box.width, box.height)
    } else {
      // Load image asynchronously from all paths
      imagePaths.forEach((path) => {
        loadImage(path).catch(() => {
          // Ignore errors, will show placeholder
        })
      })

      // Draw placeholder
      ctx.fillStyle = '#333333'
      ctx.fillRect(position.x, position.y, box.width, box.height)

      ctx.fillStyle = '#666666'
      ctx.font = '14px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Loading...', position.x + box.width / 2, position.y + box.height / 2)
    }
  } else {
    // No asset ID, draw placeholder
    ctx.fillStyle = '#333333'
    ctx.fillRect(position.x, position.y, box.width, box.height)

    ctx.fillStyle = '#666666'
    ctx.font = '14px Inter'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('No Image', position.x + box.width / 2, position.y + box.height / 2)
  }

  // Draw selection border
  if (isSelected) {
    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 2
    ctx.strokeRect(position.x - 2, position.y - 2, box.width + 4, box.height + 4)
  }
}


