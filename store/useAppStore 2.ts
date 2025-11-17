import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

type AppStage = 'not-connected' | 'club-selection' | 'workout-selection' | 'connected' | 'loading'

type AppStoreState = {
  stage: AppStage
  currentClub: string | null
  currentTemplate: string | null
  currentActivity: any | null
  templates: any[]
  activities: any[]
}

type AppStoreActions = {
  setStage(stage: AppStage): void
  setCurrentClub(clubId: string | null): void
  setCurrentTemplate(templateId: string | null): void
  setCurrentActivity(activity: any | null): void
  setTemplates(templates: any[]): void
  setActivities(activities: any[]): void
}

type AppStore = AppStoreState & AppStoreActions

export const useAppStore = create<AppStore>()(
  devtools(
    immer((set) => ({
      stage: 'not-connected',
      currentClub: null,
      currentTemplate: null,
      currentActivity: null,
      templates: [],
      activities: [],
      
      setStage: (stage) => {
        set((draft) => {
          draft.stage = stage
        }, false, 'setStage')
      },
      
      setCurrentClub: (clubId) => {
        set((draft) => {
          draft.currentClub = clubId
          // Load templates for club
          if (clubId) {
            localStorage.setItem('selected_club', clubId)
          }
        }, false, 'setCurrentClub')
      },
      
      setCurrentTemplate: (templateId) => {
        set((draft) => {
          draft.currentTemplate = templateId
          if (templateId) {
            localStorage.setItem('selected_template', templateId)
          }
        }, false, 'setCurrentTemplate')
      },
      
      setCurrentActivity: (activity) => {
        set((draft) => {
          draft.currentActivity = activity
        }, false, 'setCurrentActivity')
      },
      
      setTemplates: (templates) => {
        set((draft) => {
          draft.templates = templates
        }, false, 'setTemplates')
      },
      
      setActivities: (activities) => {
        set((draft) => {
          draft.activities = activities
        }, false, 'setActivities')
      },
    })),
  ),
)

