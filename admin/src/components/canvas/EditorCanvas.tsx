import { useEffect, useMemo, useRef } from 'react'
import { Box } from '@mui/material'
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva'
import Konva from 'konva'
import { useEditorStore } from '../../store/useEditorStore'
import { createDefaultTextElement } from '../../utils/elements'
import type { TextElement } from '../../types'

const CANVAS_PADDING = 64

export const EditorCanvas = () => {
  const template = useEditorStore((store) => store.state.template)
  const pageId = useEditorStore((store) => store.state.pageId)
  const ui = useEditorStore((store) => store.state.ui)
  const selectedElementIds = useEditorStore((store) => store.state.selectedElementIds)
  const addElement = useEditorStore((store) => store.addElement)
  const selectElements = useEditorStore((store) => store.selectElements)
  const moveElement = useEditorStore((store) => store.moveElement)

  const page = useMemo(() => {
    if (!template.pages.length) {
      return undefined
    }
    return template.pages.find((candidate) => candidate.id === pageId) ?? template.pages[0]
  }, [template.pages, pageId])

  const layer = page?.layers[0]

  useEffect(() => {
    if (layer && layer.elements.length === 0 && page) {
      addElement(
        layer.id,
        createDefaultTextElement({
          position: { x: page.size.width / 2 - 150, y: page.size.height / 2 - 40 },
          content: 'Добавьте ваш текст',
        }),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, page])

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
      flex={1}
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ backgroundColor: '#E5E7EB', overflow: 'auto', position: 'relative' }}
    >
      <Stage
        ref={(node) => {
          stageRef.current = node
        }}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={(event) => {
          const stage = event.target.getStage()
          if (!stage) return
          const clickedOnEmpty = event.target === stage
          if (clickedOnEmpty) {
            selectElements([])
          }
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
