import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import { produce } from 'immer'
import type { EditorElement, EditorState, Point, Template } from '../types/index.ts'
import { createTemplateDraft } from '../utils/templateFactory.ts'

type EditorStore = {
  state: EditorState
  setTemplate(template: Template): void
  selectPage(pageId: string): void
  selectElements(elementIds: string[]): void
  updateElement(elementId: string, updater: (element: EditorElement) => void): void
  addElement(layerId: string, element: EditorElement): void
  moveElement(elementId: string, position: Point): void
  duplicateSelection(): void
  deleteSelection(): void
  updateUi(updater: (ui: EditorState['ui']) => void): void
}

const findElement = (
  template: Template,
  elementId: string,
): { element: EditorElement; layerIndex: number; pageIndex: number } | null => {
  for (let pageIndex = 0; pageIndex < template.pages.length; pageIndex += 1) {
    const page = template.pages[pageIndex]
    for (let layerIndex = 0; layerIndex < page.layers.length; layerIndex += 1) {
      const layer = page.layers[layerIndex]
      const element = layer.elements.find((item) => item.id === elementId)
      if (element) {
        return { element, layerIndex, pageIndex }
      }
    }
  }
  return null
}

const initialTemplate = createTemplateDraft()

export const useEditorStore = create<EditorStore>()(
  devtools(
    immer((set) => ({
      state: {
        template: initialTemplate,
        pageId: initialTemplate.pages[0]?.id ?? '',
        selectedElementIds: [],
        hoveredElementId: null,
        clipboard: null,
        ui: {
          snapToGrid: true,
          showGuides: true,
          showRulers: true,
          zoom: 1,
          pan: { x: 0, y: 0 },
        },
      },
      setTemplate: (template) =>
        set((draft) => {
          draft.state.template = template
          draft.state.pageId = template.pages[0]?.id ?? ''
        }, false, 'setTemplate'),
      selectPage: (pageId) =>
        set((draft) => {
          draft.state.pageId = pageId
          draft.state.selectedElementIds = []
        }, false, 'selectPage'),
      selectElements: (elementIds) =>
        set((draft) => {
          draft.state.selectedElementIds = elementIds
        }, false, 'selectElements'),
      updateElement: (elementId, updater) =>
        set((draft) => {
          const result = findElement(draft.state.template, elementId)
          if (!result) return
          updater(result.element)
        }, false, 'updateElement'),
      addElement: (layerId, element) =>
        set((draft) => {
          draft.state.template.pages.forEach((page) => {
            page.layers.forEach((layer) => {
              if (layer.id === layerId) {
                layer.elements.push(element)
              }
            })
          })
          draft.state.selectedElementIds = [element.id]
        }, false, 'addElement'),
      moveElement: (elementId, position) =>
        set((draft) => {
          const result = findElement(draft.state.template, elementId)
          if (!result) return
          result.element.position = position
        }, false, 'moveElement'),
      duplicateSelection: () =>
        set((draft) => {
          const { selectedElementIds, template } = draft.state
          if (!selectedElementIds.length) return
          const newSelection: string[] = []
          selectedElementIds.forEach((id) => {
            const result = findElement(template, id)
            if (!result) return
            const { layerIndex, pageIndex, element } = result
            const clone = produce(element, (draftElement) => {
              draftElement.id = nanoid()
              draftElement.position = {
                x: draftElement.position.x + 16,
                y: draftElement.position.y + 16,
              }
              draftElement.name = `${draftElement.name} Copy`
            })
            template.pages[pageIndex].layers[layerIndex].elements.push(clone)
            newSelection.push(clone.id)
          })
          draft.state.selectedElementIds = newSelection
        }, false, 'duplicateSelection'),
      deleteSelection: () =>
        set((draft) => {
          const { selectedElementIds } = draft.state
          if (!selectedElementIds.length) return
          draft.state.template.pages.forEach((page) => {
            page.layers.forEach((layer) => {
              layer.elements = layer.elements.filter(
                (element) => !selectedElementIds.includes(element.id),
              )
            })
          })
          draft.state.selectedElementIds = []
        }, false, 'deleteSelection'),
      updateUi: (updater) =>
        set((draft) => {
          updater(draft.state.ui)
        }, false, 'updateUi'),
    })),
  ),
)

export const useTemplate = () => useEditorStore((store) => store.state.template)
export const useEditorSelection = () =>
  useEditorStore((store) => store.state.selectedElementIds)
export const useEditorUi = () => useEditorStore((store) => store.state.ui)
export const useEditorActions = () =>
  useEditorStore((store) => ({
    setTemplate: store.setTemplate,
    selectPage: store.selectPage,
    selectElements: store.selectElements,
    updateElement: store.updateElement,
    addElement: store.addElement,
    moveElement: store.moveElement,
    duplicateSelection: store.duplicateSelection,
    deleteSelection: store.deleteSelection,
    updateUi: store.updateUi,
  }))
