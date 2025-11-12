import { useEffect, useRef, useState, useCallback } from 'react'
import { Box } from '@mui/material'
import { useEditorStore } from '../../store/useEditorStore'
import type { Page, EditorElement, TextElement, ShapeElement, ImageElement } from '../../types'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

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
  const selectElements = useEditorStore((store) => store.selectElements)
  const moveElement = useEditorStore((store) => store.moveElement)

  const page = template.pages.find((p) => p.id === pageId) || template.pages[0]

  // Calculate fit-to-screen scale
  useEffect(() => {
    if (!containerRef.current) return
    
    // If no page, still set up container
    if (!page) {
      const container = containerRef.current
      const width = container.clientWidth
      const height = container.clientHeight
      setScale(1)
      setPan({ x: (width - CANVAS_WIDTH) / 2, y: (height - CANVAS_HEIGHT) / 2 })
      return
    }

    const container = containerRef.current
    const updateSize = () => {
      const width = container.clientWidth
      const height = container.clientHeight

      // Calculate scale to fit canvas
      const scaleX = (width - 64) / CANVAS_WIDTH
      const scaleY = (height - 64) / CANVAS_HEIGHT
      const fitScale = Math.min(scaleX, scaleY, 1)
      setScale(fitScale)

      // Center canvas
      const scaledWidth = CANVAS_WIDTH * fitScale
      const scaledHeight = CANVAS_HEIGHT * fitScale
      setPan({
        x: (width - scaledWidth) / 2,
        y: (height - scaledHeight) / 2,
      })
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [page])

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

    // Set canvas size
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (!page) {
      // Render placeholder if no page
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#666666'
      ctx.font = '32px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Нет страницы', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      return
    }

    // Render background
    renderBackground(ctx, page)

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
  }, [page, selectedElementIds])

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

  const displayWidth = CANVAS_WIDTH * scale
  const displayHeight = CANVAS_HEIGHT * scale

  return (
    <Box
      ref={containerRef}
      flex={1}
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
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

// Render functions
function renderBackground(ctx: CanvasRenderingContext2D, page: Page) {
  if (page.background?.gradient) {
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    page.background.gradient.stops.forEach((stop) => {
      gradient.addColorStop(stop.offset, stop.color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  } else if (page.background?.color) {
    ctx.fillStyle = page.background.color
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  } else {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
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

  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
  ctx.fillStyle = style.fill
  ctx.textAlign = style.textAlign as CanvasTextAlign
  ctx.textBaseline = 'top'

  // Handle multiline text
  const lines = content.split('\n')
  const lineHeight = style.lineHeight
  let y = position.y

  lines.forEach((line) => {
    ctx.fillText(line, position.x, y)
    y += lineHeight
  })

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
      ctx.strokeStyle = element.stroke.color
      ctx.lineWidth = element.stroke.width
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
    const imagePaths = [
      `/assets/${assetId}`,
      `/route/assets/${assetId}`,
      `/${assetId}`,
    ]

    // Try to get cached image
    let image: HTMLImageElement | null = null
    for (const path of imagePaths) {
      if (imageCache.has(path)) {
        image = imageCache.get(path)!
        break
      }
    }

    if (image && image.complete) {
      ctx.drawImage(image, position.x, position.y, box.width, box.height)
    } else {
      // Load image asynchronously
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

