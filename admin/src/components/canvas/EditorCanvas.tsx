import { useEffect, useMemo, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva'
import Konva from 'konva'
import { useEditorStore } from '../../store/useEditorStore'
import { createDefaultTextElement } from '../../utils/elements'
import type { TextElement } from '../../types'

const CANVAS_PADDING = 64
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.1

export const EditorCanvas = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const ui = useEditorStore((store) => store.state.ui)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)
  const addElement = useEditorStore((store) => store.addElement)
  const selectElements = useEditorStore((store) => store.selectElements)
  const moveElement = useEditorStore((store) => store.moveElement)
  const updateUi = useEditorStore((store) => store.updateUi)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const page = useMemo(() => {
    if (!template.pages.length) {
      return undefined
    }
    return template.pages.find((candidate) => candidate.id === pageId) ?? template.pages[0]
  }, [template.pages, pageId])

  const layer = page?.layers[0]
  const layerId = layer?.id
  const elementsCount = layer?.elements.length ?? 0
  const hasInitializedRef = useRef(false)

  // Calculate fit-to-screen zoom on page change
  useEffect(() => {
    if (!page || !containerRef.current) return
    
    const container = containerRef.current
    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }
    
    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [page])
  
  // Fit to screen when page or container size changes
  useEffect(() => {
    if (!page || containerSize.width === 0 || containerSize.height === 0) return
    
    const availableWidth = containerSize.width - CANVAS_PADDING * 2
    const availableHeight = containerSize.height - CANVAS_PADDING * 2
    
    const scaleX = availableWidth / page.size.width
    const scaleY = availableHeight / page.size.height
    const fitZoom = Math.min(scaleX, scaleY, 1) // Don't zoom in more than 100%
    
    updateUi((ui) => {
      ui.zoom = fitZoom
      // Center the canvas
      ui.pan = {
        x: (containerSize.width - page.size.width * fitZoom) / 2 - CANVAS_PADDING,
        y: (containerSize.height - page.size.height * fitZoom) / 2 - CANVAS_PADDING,
      }
    })
  }, [page, containerSize, updateUi])
  
  useEffect(() => {
    // Инициализируем только один раз для каждого layer
    if (layer && layerId && elementsCount === 0 && page && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      addElement(
        layerId,
        createDefaultTextElement({
          position: { x: page.size.width / 2 - 150, y: page.size.height / 2 - 40 },
          content: 'Добавьте ваш текст',
        }),
      )
    }
    
    // Сбрасываем флаг при смене layer
    return () => {
      if (hasInitializedRef.current && layerId) {
        hasInitializedRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerId, elementsCount])

  const stageRef = useRef<Konva.Stage | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const elementRefs = useRef<Record<string, Konva.Node>>({})

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return

    const nodes = selectedElementIds
      .map((id) => elementRefs.current[id])
      .filter((node): node is Konva.Node => Boolean(node))

    transformer.nodes(nodes)
    transformer.getLayer()?.batchDraw()
  }, [selectedElementIds])

  if (!page || !layer) {
    return <Box flex={1} display="flex" alignItems="center" justifyContent="center">Нет страницы</Box>
  }

  const canvasWidth = page.size.width * ui.zoom + CANVAS_PADDING * 2
  const canvasHeight = page.size.height * ui.zoom + CANVAS_PADDING * 2

  const handleElementRef = (id: string, node: Konva.Node | null) => {
    if (node) {
      elementRefs.current[id] = node
    } else {
      delete elementRefs.current[id]
    }
  }
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    
    if (!page || !containerRef.current) return
    
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ui.zoom + delta))
    
    // Get mouse position relative to container
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calculate zoom point relative to canvas
    const canvasX = mouseX - CANVAS_PADDING - ui.pan.x
    const canvasY = mouseY - CANVAS_PADDING - ui.pan.y
    
    // Calculate new pan to keep the zoom point under the mouse
    const zoomRatio = newZoom / ui.zoom
    const newPanX = mouseX - CANVAS_PADDING - canvasX * zoomRatio
    const newPanY = mouseY - CANVAS_PADDING - canvasY * zoomRatio
    
    updateUi((ui) => {
      ui.zoom = newZoom
      ui.pan = { x: newPanX, y: newPanY }
    })
  }

  const renderTextElement = (element: TextElement) => (
    <Text
      key={element.id}
      ref={(node) => handleElementRef(element.id, node)}
      text={element.content}
      x={element.position.x}
      y={element.position.y}
      width={element.box.width}
      height={element.box.height}
      draggable
      fontFamily={element.style.fontFamily}
      fontSize={element.style.fontSize}
      fontStyle={`${element.style.fontStyle} ${element.style.fontWeight}`.trim()}
      fill={element.style.fill}
      align={element.style.textAlign}
      lineHeight={element.style.lineHeight / element.style.fontSize}
      letterSpacing={element.style.letterSpacing}
      shadowColor={element.style.shadow?.color}
      shadowBlur={element.style.shadow?.blur ?? 0}
      shadowOffset={element.style.shadow?.offset ?? { x: 0, y: 0 }}
      opacity={element.opacity}
      rotation={element.rotation}
      onDragStart={() => {
        selectElements([element.id])
      }}
      onDragEnd={(evt) => {
        const node = evt.target
        moveElement(element.id, { x: node.x(), y: node.y() })
      }}
      onClick={() => selectElements([element.id])}
      onTap={() => selectElements([element.id])}
      listening
    />
  )

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
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
      }}
      onWheel={handleWheel}
    >
      <Stage
        ref={(node) => {
          stageRef.current = node
        }}
        width={canvasWidth}
        height={canvasHeight}
        x={ui.pan.x}
        y={ui.pan.y}
        onMouseDown={(event) => {
          const stage = event.target.getStage()
          if (!stage) return
          const clickedOnEmpty = event.target === stage
          if (clickedOnEmpty) {
            selectElements([])
          }
        }}
        draggable
        onDragEnd={(e) => {
          const stage = e.target
          updateUi((ui) => {
            ui.pan = { x: stage.x(), y: stage.y() }
          })
        }}
        style={{ background: 'transparent' }}
      >
        <Layer scale={{ x: ui.zoom, y: ui.zoom }} x={CANVAS_PADDING} y={CANVAS_PADDING} listening>
          <Rect
            x={0}
            y={0}
            width={page.size.width}
            height={page.size.height}
            fill={page.background?.color ?? '#ffffff'}
            shadowColor="rgba(15,23,42,0.16)"
            shadowBlur={24}
            shadowOpacity={0.8}
            cornerRadius={24}
          />

          {layer.elements.map((element) => {
            if (element.kind === 'text') {
              return renderTextElement(element)
            }
            return null
          })}

          <Transformer
            ref={(node) => {
              transformerRef.current = node
            }}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            borderStroke="#2563EB"
            anchorStroke="#2563EB"
            anchorFill="#DBEAFE"
            anchorSize={8}
            keepRatio={false}
          />
        </Layer>
      </Stage>
    </Box>
  )
}
